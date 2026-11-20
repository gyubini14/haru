import type { Response as OpenAIResponse } from "openai/resources/responses/responses";
import { z } from "zod";
import { distanceKm } from "@/lib/geo";
import {
  MAX_ANSWER_PLACES,
  MAX_ITINERARY_PLACES,
  MIN_ITINERARY_PLACES,
  NEARBY_RADIUS_KM,
  OPENAI_ITINERARY_MAX_OUTPUT_TOKENS,
  OPENAI_MAX_OUTPUT_TOKENS,
  OPENAI_MODEL,
} from "@/lib/constants";
import { MESSAGES } from "@/lib/messages";
import { getOpenAIClient } from "@/lib/server/openaiClient";
import { attachPositions, describeLocation, locateRoute } from "@/lib/server/places";
import { buildInstructions } from "@/lib/server/prompts";
import { fixTravelTimes } from "@/lib/server/travel";
import { triage, type Triage } from "@/lib/server/triage";
import type { ChatMessage, ChatResponse, ItineraryStop, Place, Position } from "@/lib/types";

// Design Ref: §4.4 — AI가 돌려주는 "글 + 장소 목록" 형식. 지도·일정이 이 장소 목록을 그대로 쓴다.
// source_url은 AI가 적지만, 실제 웹 검색 결과에 있는 주소인지는 코드가 확인한다.
const placeSchema = z.object({
  name: z.string(),
  area: z.string(),
  reason: z.string(),
  how_to_get_there: z.string(),
  tip: z.string().nullable(),
  // 촬영지 질문에서만 쓰는 작품·가수 이름. (출처 주소 source_url과 헷갈리지 않게 이름을 work_name으로 한다)
  work_name: z.string().nullable(),
  // 출처 주소는 반드시 적게 한다. 적을 수 없는 장소는 추천하지 않도록 지침에 정해 두었다.
  source_url: z.string(),
  booking_tips: z.string().nullable(),
});

// 하루 일정의 한 칸: 방문 시간대 + 장소 + 다음 장소까지의 이동 (PRD N1)
const stopSchema = z.object({
  time: z.string(),
  place: placeSchema,
  travel_to_next: z.object({ mode: z.string(), minutes: z.number() }).nullable(),
});

const modelAnswerSchema = z.object({
  // 거절은 분류 단계에서 코드가 처리한다. 하루 일정은 kind="itinerary"와 stops로 받는다.
  kind: z.enum(["answer", "itinerary", "clarify"]),
  reply: z.string(),
  places: z.array(placeSchema),
  stops: z.array(stopSchema),
});

type ModelAnswer = z.infer<typeof modelAnswerSchema>;

// OpenAI에 알려 줄 형식 설명 (zod 형식에서 자동으로 만든다)
const answerJsonSchema = z.toJSONSchema(modelAnswerSchema) as Record<string, unknown>;
delete answerJsonSchema.$schema; // OpenAI는 이 항목을 받지 않는다

/** 주소를 비교하기 좋게 다듬는다. 웹 주소(http·https)가 아니면 null. */
function normalizeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // AI가 주소를 "([booking.com](https://...))"처럼 마크다운 인용으로 감싸서 적는 경우가 있어, 그 안의 주소만 꺼낸다.
  const found = raw.match(/https?:\/\/[^\s)\]>"']+/);
  if (!found) return null;
  try {
    const url = new URL(found[0]);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    url.searchParams.delete("utm_source"); // OpenAI가 검색 결과 주소에 붙이는 표시
    url.hash = "";
    return url.href.replace(/\/$/, "");
  } catch {
    return null;
  }
}

// 한국인이 주로 쓰는 사이트 (커뮤니티·블로그·예약 사이트). 주소 끝이 .kr인 사이트도 한국 사이트로 본다.
const KOREAN_SITE_HINTS = [
  "naver.com",
  "tistory.com",
  "daum.net",
  "kakao.com",
  "yanolja.com",
  "goodchoice.kr",
  "yeogi",
  "dcinside.com",
  "ppomppu.co.kr",
  "clien.net",
];

/** 출처 주소가 한국 사이트인지 (한국인 커뮤니티·리뷰 근거인지 화면에 알려 주기 위한 표시) */
function isKoreanSite(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host.endsWith(".kr") || KOREAN_SITE_HINTS.some((hint) => host.includes(hint));
  } catch {
    return false;
  }
}

/** 이번 답변을 만들 때 AI가 실제로 웹 검색에서 찾은 주소 모음 */
function collectSearchedUrls(response: OpenAIResponse): Set<string> {
  const urls = new Set<string>();
  const add = (raw: string | null | undefined) => {
    const url = normalizeUrl(raw);
    if (url) urls.add(url);
  };
  for (const item of response.output) {
    if (item.type === "web_search_call") {
      if (item.action.type === "search") {
        for (const source of item.action.sources ?? []) add(source.url); // 검색 결과
      } else if (item.action.type === "open_page") {
        add(item.action.url); // AI가 실제로 열어 본 페이지
      }
    } else if (item.type === "message") {
      for (const part of item.content) {
        if (part.type !== "output_text") continue;
        for (const note of part.annotations ?? []) {
          if (note.type === "url_citation") add(note.url); // 답변에 인용된 페이지
        }
      }
    }
  }
  return urls;
}

/**
 * 화면은 글을 그대로 보여 주므로(마크다운을 해석하지 않음) 별표·제목 기호·링크 문법을 걷어낸다.
 * AI에게 쓰지 말라고 했지만 긴 답변에서 가끔 섞여 나온다.
 */
function toPlainText(text: string): string {
  return text
    .replace(/[-]/g, "") // 웹 검색 인용 표시에 쓰이는 보이지 않는 문자
    .replace(/\b(?:cite)?turn\d+[a-z]+\d+\b/gi, "") // 인용 번호 표시 (예: turn0search2)
    .replace(/\[([^\]]+)\]\(https?:\/\/[^)]*\)/g, "$1") // [글](주소) → 글
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|\s)\*([^*\n]+)\*(?=\s|$)/g, "$1$2")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/`/g, "")
    .trim();
}

/**
 * AI가 적은 장소 중, 출처 주소가 실제 웹 검색 결과에 있는 것만 "확인됨"으로 인정한다.
 * (PRD 5번 M1 규칙 5·8: 웹 검색에서 확인하지 못한 장소는 보여 주지 않는다.)
 */
function toVerifiedPlace(
  p: ModelAnswer["places"][number],
  searched: Set<string>,
  isFilming: boolean,
  namedWork: string | null,
): Place | null {
  const sourceUrl = normalizeUrl(p.source_url);
  if (!sourceUrl || !searched.has(sourceUrl)) return null;

  let tip = toPlainText(p.tip ?? "") || null;
  // 작품·가수 이름: AI가 적은 값을 우선하고, 비어 있으면 사용자가 말한 이름(분류 단계)을 쓴다.
  const work = toPlainText(p.work_name ?? "") || namedWork;
  // PRD M2 규칙 2: 촬영지는 방문 팁이 반드시 있어야 한다. AI가 비우거나 "please verify" 같은 빈말을 쓰면
  // (실험에서 자주 그랬다) 장소를 버리지 않고 일반적인 안전한 팁으로 채운다.
  if (isFilming && (!tip || tip.length < 15 || /^please verify/i.test(tip))) {
    tip = MESSAGES.defaultFilmingTip;
  }
  // 어느 작품·가수의 촬영지인지 알 수 없는 장소는 촬영지로 안내하지 않는다. (그냥 유명 관광지를 촬영지라고 소개하는 것을 막음)
  if (isFilming && !work) return null;
  // 장소 이름이 작품·노래 제목과 같으면 실제 장소가 아니라 제목을 장소처럼 적은 것이므로 제외한다.
  if (isFilming && work && toPlainText(p.name).toLowerCase() === work.toLowerCase()) return null;

  return {
    name: toPlainText(p.name),
    // 한글 이름은 AI가 적게 하지 않는다 (실험에서 그럴듯하게 틀린 이름을 지어냈다). Google 장소 검색이
    // 알려 주는 한글 이름만 좌표를 찾을 때 채운다 (places.ts).
    nameKo: null,
    area: toPlainText(p.area),
    reason: toPlainText(p.reason),
    howToGetThere: toPlainText(p.how_to_get_there),
    tip,
    // 작품·가수 이름(source)은 촬영지 질문에서만 쓴다. 다른 질문에서는 AI가 글 제목 같은 엉뚱한 값을 넣기도 해서 비운다.
    source: isFilming ? work : null,
    verified: true,
    sourceUrl,
    fromKoreanSource: isKoreanSite(sourceUrl),
    bookingTips: toPlainText(p.booking_tips ?? "") || null,
    // 좌표는 작업 12(장소 이름 → 좌표 변환)에서 채운다.
    position: null,
    photo: null,
    mapNote: null,
  };
}

// "Lunch", "Dinner in Myeongdong"처럼 끼니 이름만 있고 구체적인 장소 이름이 없는 일정 항목
const GENERIC_STOP_NAME =
  /^(?:a\s+)?(?:(?:k-beauty\s+)?shopping|street\s+food|sightseeing|food\s+tour|breakfast|brunch|lunch|dinner|coffee(?:\s+break)?|snack|free\s+time|rest)(?:\s+(?:in|at|near|around)\s+[\w\s-]+)?$/i;

/** AI 답변을 화면용 응답으로 바꾼다. 확인된 장소만 최대 3곳 남긴다. */
function toChatResponse(
  answer: ModelAnswer,
  searched: Set<string>,
  isFilming: boolean,
  namedWork: string | null,
): ChatResponse {
  // 하루 일정: 확인된 장소만 남기고, 3곳 미만이면 일정으로 보여 주지 않고 되묻는다 (PRD N1)
  if (answer.kind === "itinerary") {
    const stops: ItineraryStop[] = answer.stops
      .map((s) => ({ s, place: toVerifiedPlace(s.place, searched, false, null) }))
      .filter((x): x is { s: (typeof answer.stops)[number]; place: Place } => x.place !== null)
      // 장소가 아닌 항목("Lunch in Myeongdong")과 같은 장소의 반복은 일정에서 뺀다
      .filter(({ place }) => !GENERIC_STOP_NAME.test(place.name))
      .filter(({ place }, i, all) => {
        const key = place.name.toLowerCase();
        return all.findIndex((o) => o.place.name.toLowerCase() === key) === i;
      })
      .slice(0, MAX_ITINERARY_PLACES)
      .map(({ s, place }) => ({
        time: toPlainText(s.time),
        place,
        travelToNext: s.travel_to_next
          ? {
              mode: toPlainText(s.travel_to_next.mode),
              minutes: Math.max(1, Math.round(s.travel_to_next.minutes)),
            }
          : null,
      }));
    if (stops.length < MIN_ITINERARY_PLACES) {
      return { kind: "clarify", reply: MESSAGES.noConfirmedItinerary, places: [], itinerary: null };
    }
    // 마지막 장소에는 "다음 장소"가 없다 (중간 장소가 걸러졌어도 이동 안내가 엉키지 않게 한다)
    stops[stops.length - 1].travelToNext = null;
    return { kind: "itinerary", reply: toPlainText(answer.reply), places: [], itinerary: { stops } };
  }

  // 되묻기 답변에는 장소 카드를 붙이지 않는다.
  if (answer.kind !== "answer") {
    return { kind: answer.kind, reply: toPlainText(answer.reply), places: [], itinerary: null };
  }

  const places = answer.places
    .map((p) => toVerifiedPlace(p, searched, isFilming, namedWork))
    .filter((p): p is Place => p !== null)
    .slice(0, MAX_ANSWER_PLACES);

  // 장소를 추천하려 했지만 확인된 곳이 하나도 없으면, 지어낸 장소를 보여 주지 않는다.
  // 촬영지는 "확인된 정보가 없다"고 알리고(PRD M2 규칙 3), 그 외에는 되묻는다.
  if (answer.places.length > 0 && places.length === 0) {
    return {
      kind: isFilming ? "answer" : "clarify",
      reply: isFilming ? MESSAGES.noFilmingLocations : MESSAGES.noConfirmedPlaces,
      places: [],
      itinerary: null,
    };
  }
  return { kind: answer.kind, reply: toPlainText(answer.reply), places, itinerary: null };
}

/** 분류 결과가 거절·되묻기이면 AI 답변 없이 곧바로 보낼 응답을 돌려준다. 아니면 null. */
function answerFromTriage(t: Triage, hasLocation: boolean): ChatResponse | null {
  // M1 규칙 7: 영어가 아닌 질문에는 내용에 답하지 않고 고정 안내만 보낸다.
  if (!t.is_english) {
    return { kind: "refusal", reply: MESSAGES.askInEnglish, places: [], itinerary: null };
  }
  // 촬영지 질문인데 어느 작품·가수인지 모르면 검색하지 않고 먼저 묻는다. (PRD M2: 작품이나 가수 이름을 입력하면 안내)
  if (t.topic === "filming_location" && !t.named_work) {
    return { kind: "clarify", reply: MESSAGES.askWhichWork, places: [], itinerary: null };
  }
  // 하루 일정인데 어느 지역인지 모르면 검색하지 않고 먼저 묻는다. (내 위치를 켜 두었으면 그 주변으로 본다)
  if (t.topic === "day_plan" && !t.area_known && !hasLocation) {
    return { kind: "clarify", reply: MESSAGES.askDayPlanArea, places: [], itinerary: null };
  }
  // 인사에는 검색 없이 환영 문구로 답한다.
  if (t.topic === "greeting") {
    return { kind: "answer", reply: MESSAGES.welcome, places: [], itinerary: null };
  }
  // M1 규칙 6: 정해진 주제 밖의 질문은 거절하고 도울 수 있는 주제를 안내한다.
  if (t.topic === "other") {
    return { kind: "refusal", reply: MESSAGES.offTopic, places: [], itinerary: null };
  }
  // M1 규칙 4: 숙소는 지역·예산·인원 중 빠진 것을 모두 한 번에 되묻고, 다 모이기 전에는 추천하지 않는다.
  if (t.topic === "accommodation") {
    const missing: string[] = [];
    // 내 위치를 켜 두었으면 지역은 이미 아는 것으로 본다
    if (!t.area_known && !hasLocation) missing.push(MESSAGES.accommodationItems.area);
    if (!t.budget_known) missing.push(MESSAGES.accommodationItems.budget);
    if (!t.guests_known) missing.push(MESSAGES.accommodationItems.guests);
    if (missing.length > 0) {
      return {
        kind: "clarify",
        reply: MESSAGES.askAccommodationInfo(missing),
        places: [],
        itinerary: null,
      };
    }
  }
  return null;
}

/**
 * 웹 검색 도구는 마지막 사용자 메시지를 그대로 검색어로 쓴다. (지침으로 한국어 검색을 시켜도 따르지 않음)
 * 그래서 숙소 질문은 마지막 메시지에 한국어 검색어를 덧붙여 한국인 블로그·후기가 함께 검색되게 한다.
 * 실험에서 영어 요청만 보냈을 때 한국 사이트가 17개 중 0개였고, 이 방식에서는 29개 중 9개였다.
 */
function withKoreanSearch(
  messages: ChatMessage[],
  koreanQuery: string | null,
  nearArea: string | null,
) {
  const input = messages.map((m) => ({ role: m.role, content: m.content }));
  const last = input[input.length - 1];
  // 내 위치를 켠 경우: 검색이 그 주변을 찾도록 가까운 역·장소 이름을 덧붙인다
  if (nearArea) last.content = `${last.content}\n\n(The user is currently near ${nearArea}, Korea. Search for places around there.)`;
  if (!koreanQuery) return input;
  last.content = `${last.content}\n\nMake two separate web searches: first the English request above, second with the Korean query: ${koreanQuery} 네이버 블로그`;
  return input;
}

/** 이전 Haru 답변(일정)에 적힌 "[source: 주소]"를 모은다. 일정 수정 요청에서 바뀌지 않는 장소를 유지하는 데 쓴다. */
function urlsFromHistory(messages: ChatMessage[]): string[] {
  const urls: string[] = [];
  for (const m of messages) {
    if (m.role !== "assistant") continue;
    for (const found of m.content.matchAll(/\[source: (https?:\/\/[^\]\s]+)\]/g)) {
      const url = normalizeUrl(found[1]);
      if (url) urls.push(url);
    }
  }
  return urls;
}

/** 최근 대화를 분류한 뒤, 필요한 경우에만 웹 검색으로 확인한 Haru의 답변(글 + 장소 목록)을 받는다. */
export async function askHaru(
  messages: ChatMessage[],
  // 사용자가 "내 위치 사용"을 켠 경우에만 있다. 이미 약 1km로 줄인 좌표이며 저장하지 않는다.
  location: Position | null = null,
): Promise<ChatResponse> {
  // 1단계: 분류 (웹 검색 없음, 가볍고 빠름)
  const classified = await triage(messages);
  const early = answerFromTriage(classified, location !== null);
  if (early) return early;

  // 2단계: 웹 검색을 쓰는 답변. 숙소·촬영지는 한국어 검색어로도 한국 사이트를 찾게 한다.
  const isFilming = classified.topic === "filming_location";
  const koreanQuery =
    classified.topic === "accommodation" || isFilming ? classified.korean_search_query : null;
  const isDayPlan = classified.topic === "day_plan";
  const nearArea = location ? await describeLocation(location) : null;
  const response = await getOpenAIClient().responses.create({
    model: OPENAI_MODEL,
    instructions: buildInstructions({ isFilming, isDayPlan, location, nearArea }),
    input: withKoreanSearch(messages, koreanQuery, nearArea),
    tools: [{ type: "web_search", user_location: { type: "approximate", country: "KR" } }],
    include: ["web_search_call.action.sources"],
    // 매번 웹 검색을 하게 한다. 검색을 건너뛰면 출처 주소를 확인할 수 없어 장소가 모두 걸러진다.
    tool_choice: "required",
    max_output_tokens: isDayPlan ? OPENAI_ITINERARY_MAX_OUTPUT_TOKENS : OPENAI_MAX_OUTPUT_TOKENS,
    text: {
      format: {
        type: "json_schema",
        name: "haru_answer",
        strict: true,
        schema: answerJsonSchema,
      },
    },
  });

  // 형식이 어긋나면 오류를 던지고, 호출한 쪽(route.ts)에서 영어 오류 안내로 바꾼다.
  const answer = modelAnswerSchema.parse(JSON.parse(response.output_text));
  if (!answer.reply.trim() && answer.places.length === 0 && answer.stops.length === 0) {
    throw new Error("empty answer");
  }
  const namedWork = isFilming ? toPlainText(classified.named_work ?? "") || null : null;
  const searched = collectSearchedUrls(response);
  // 일정 일부를 고치는 요청에서는, 바꾸지 않는 장소를 다시 검색하지 못할 수 있다. 그래서 앞서 확인되어
  // 보여 준 일정의 출처 주소("[source: …]")는 이번에도 확인된 것으로 인정한다.
  if (isDayPlan) for (const url of urlsFromHistory(messages)) searched.add(url);
  const chat = toChatResponse(answer, searched, isFilming, namedWork);

  // 하루 일정: 일정의 장소들에 좌표를 채운다. 여러 곳을 도는 일정이라 반경 2km 제한은 적용하지 않는다.
  if (chat.itinerary) {
    const stops = chat.itinerary.stops;
    const placedStops = await attachPositions(stops.map((s) => s.place));
    const located = stops.map((s, i) => ({ ...s, place: placedStops[i] }));
    // AI가 적은 이동 시간이 거리상 불가능하면 좌표 거리로 바로잡는다
    return { ...chat, itinerary: { stops: fixTravelTimes(located) } };
  }

  // 확인된 장소의 좌표를 Google 장소 검색으로 채운다 (실패해도 답변은 그대로 보낸다)
  const [placed, route] = await Promise.all([
    attachPositions(chat.places),
    // 교통 질문의 출발지·도착지도 좌표를 찾는다 (지도에 A, B 마커로만 표시)
    chat.kind === "answer" && classified.topic === "transport" && classified.route
      ? locateRoute({
          from: { name: classified.route.from_name, area: classified.route.from_area },
          to: { name: classified.route.to_name, area: classified.route.to_area },
        })
      : Promise.resolve(null),
  ]);
  if (!location) return { ...chat, places: placed, route };

  // 내 위치를 켠 경우: 반경 2km 안에 있다고 확인된 장소만 남긴다. (AI 지침만 믿지 않고 코드가 거리를 확인)
  const nearby = placed.filter(
    (p) => p.position !== null && distanceKm(location, p.position) <= NEARBY_RADIUS_KM,
  );
  if (placed.length > 0 && nearby.length === 0) {
    return { kind: "answer", reply: MESSAGES.noPlacesNearby, places: [], itinerary: null };
  }
  return { ...chat, places: nearby, route };
}
