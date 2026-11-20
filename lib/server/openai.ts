import OpenAI from "openai";
import type { Response as OpenAIResponse } from "openai/resources/responses/responses";
import { z } from "zod";
import {
  MAX_ANSWER_PLACES,
  OPENAI_MAX_OUTPUT_TOKENS,
  OPENAI_MODEL,
  OPENAI_TIMEOUT_MS,
} from "@/lib/constants";
import { MESSAGES } from "@/lib/messages";
import { buildInstructions } from "@/lib/server/prompts";
import type { ChatMessage, ChatResponse, Place } from "@/lib/types";

// Design Ref: §4.4 — AI가 돌려주는 "글 + 장소 목록" 형식. 지도·일정이 이 장소 목록을 그대로 쓴다.
// source_url은 AI가 적지만, 실제 웹 검색 결과에 있는 주소인지는 코드가 확인한다.
const placeSchema = z.object({
  name: z.string(),
  area: z.string(),
  reason: z.string(),
  how_to_get_there: z.string(),
  tip: z.string().nullable(),
  source: z.string().nullable(),
  // 출처 주소는 반드시 적게 한다. 적을 수 없는 장소는 추천하지 않도록 지침에 정해 두었다.
  source_url: z.string(),
});

const modelAnswerSchema = z.object({
  // 먼저 채우는 확인 항목. AI의 판단만 믿지 않고 코드가 PRD M1 규칙 4·7을 지키는 데 쓴다.
  // (형식에서 앞에 두었으므로 AI가 답변을 쓰기 전에 먼저 채운다)
  is_english: z.boolean(),
  asks_accommodation: z.boolean(),
  area_known: z.boolean(),
  budget_known: z.boolean(),
  guests_known: z.boolean(),
  // 하루 일정(itinerary)은 작업 15에서 추가한다.
  kind: z.enum(["answer", "clarify", "refusal"]),
  reply: z.string(),
  places: z.array(placeSchema),
});

type ModelAnswer = z.infer<typeof modelAnswerSchema>;

// OpenAI에 알려 줄 형식 설명 (zod 형식에서 자동으로 만든다)
const answerJsonSchema = z.toJSONSchema(modelAnswerSchema) as Record<string, unknown>;
delete answerJsonSchema.$schema; // OpenAI는 이 항목을 받지 않는다

let client: OpenAI | null = null;

function getClient(): OpenAI {
  // 키는 서버 환경 변수에서만 읽는다. 값을 출력하거나 기록하지 않는다.
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  // 자동 재시도는 하지 않는다. 재시도하면 응답 시간 목표(20초)를 넘기기 쉽다.
  client ??= new OpenAI({ apiKey, timeout: OPENAI_TIMEOUT_MS, maxRetries: 0 });
  return client;
}

/** 주소를 비교하기 좋게 다듬는다. 웹 주소(http·https)가 아니면 null. */
function normalizeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    url.searchParams.delete("utm_source"); // OpenAI가 검색 결과 주소에 붙이는 표시
    url.hash = "";
    return url.href.replace(/\/$/, "");
  } catch {
    return null;
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
 * AI가 적은 장소 중, 출처 주소가 실제 웹 검색 결과에 있는 것만 "확인됨"으로 인정한다.
 * (PRD 5번 M1 규칙 5·8: 웹 검색에서 확인하지 못한 장소는 보여 주지 않는다.)
 */
function toVerifiedPlace(p: ModelAnswer["places"][number], searched: Set<string>): Place | null {
  const sourceUrl = normalizeUrl(p.source_url);
  if (!sourceUrl || !searched.has(sourceUrl)) return null;
  return {
    name: toPlainText(p.name),
    area: toPlainText(p.area),
    reason: toPlainText(p.reason),
    howToGetThere: toPlainText(p.how_to_get_there),
    tip: toPlainText(p.tip ?? "") || null,
    // 작품·가수 이름(source)은 촬영지 안내(작업 9)에서 쓴다. AI가 글 제목 같은 엉뚱한 값을 넣기도 해서 그전에는 비워 둔다.
    source: null,
    verified: true,
    sourceUrl,
    // 좌표는 작업 12(장소 이름 → 좌표 변환)에서 채운다.
    position: null,
    mapNote: null,
  };
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

/** AI 답변을 화면용 응답으로 바꾼다. 확인된 장소만 최대 3곳 남긴다. */
function toChatResponse(answer: ModelAnswer, searched: Set<string>): ChatResponse {
  // M1 규칙 7: 영어가 아닌 질문에는 내용에 답하지 않고 고정 안내만 보낸다.
  if (!answer.is_english) {
    return { kind: "refusal", reply: MESSAGES.askInEnglish, places: [], itinerary: null };
  }

  // M1 규칙 4: 숙소는 지역·예산·인원 중 빠진 것을 모두 한 번에 되묻고, 다 모이기 전에는 추천하지 않는다.
  if (answer.asks_accommodation) {
    const missing: string[] = [];
    if (!answer.area_known) missing.push(MESSAGES.accommodationItems.area);
    if (!answer.budget_known) missing.push(MESSAGES.accommodationItems.budget);
    if (!answer.guests_known) missing.push(MESSAGES.accommodationItems.guests);
    if (missing.length > 0) {
      return {
        kind: "clarify",
        reply: MESSAGES.askAccommodationInfo(missing),
        places: [],
        itinerary: null,
      };
    }
  }

  // 되묻기·거절 답변에는 장소 카드를 붙이지 않는다. (PRD M1 규칙 4·6·7)
  if (answer.kind !== "answer") {
    return { kind: answer.kind, reply: toPlainText(answer.reply), places: [], itinerary: null };
  }

  const places = answer.places
    .map((p) => toVerifiedPlace(p, searched))
    .filter((p): p is Place => p !== null)
    .slice(0, MAX_ANSWER_PLACES);

  // 장소를 추천하려 했지만 확인된 곳이 하나도 없으면, 지어낸 장소를 보여 주지 않고 되묻는다.
  if (answer.places.length > 0 && places.length === 0) {
    return { kind: "clarify", reply: MESSAGES.noConfirmedPlaces, places: [], itinerary: null };
  }
  return { kind: answer.kind, reply: toPlainText(answer.reply), places, itinerary: null };
}

/** 최근 대화를 OpenAI에 보내 웹 검색으로 확인한 Haru의 답변(글 + 장소 목록)을 받는다. */
export async function askHaru(messages: ChatMessage[]): Promise<ChatResponse> {
  const response = await getClient().responses.create({
    model: OPENAI_MODEL,
    instructions: buildInstructions(),
    input: messages.map((m) => ({ role: m.role, content: m.content })),
    tools: [{ type: "web_search", user_location: { type: "approximate", country: "KR" } }],
    // 매번 웹 검색을 하게 한다. 검색을 건너뛰면 출처 주소를 확인할 수 없어 장소가 모두 걸러진다.
    tool_choice: "required",
    include: ["web_search_call.action.sources"],
    max_output_tokens: OPENAI_MAX_OUTPUT_TOKENS,
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
  if (!answer.reply.trim() && answer.places.length === 0) {
    throw new Error("empty answer");
  }
  return toChatResponse(answer, collectSearchedUrls(response));
}
