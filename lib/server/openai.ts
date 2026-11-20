import OpenAI from "openai";
import { z } from "zod";
import {
  MAX_ANSWER_PLACES,
  OPENAI_MAX_OUTPUT_TOKENS,
  OPENAI_MODEL,
  OPENAI_TIMEOUT_MS,
} from "@/lib/constants";
import { buildInstructions } from "@/lib/server/prompts";
import type { ChatMessage, ChatResponse, Place } from "@/lib/types";

// Design Ref: §4.4 — AI가 돌려주는 "글 + 장소 목록" 형식. 지도·일정이 이 장소 목록을 그대로 쓴다.
// 장소가 웹 검색으로 확인됐는지(verified)는 AI가 스스로 적게 하지 않고 코드가 정한다.
const placeSchema = z.object({
  name: z.string(),
  area: z.string(),
  reason: z.string(),
  how_to_get_there: z.string(),
  tip: z.string().nullable(),
  source: z.string().nullable(),
});

const modelAnswerSchema = z.object({
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

function toPlace(p: ModelAnswer["places"][number]): Place {
  return {
    name: p.name,
    area: p.area,
    reason: p.reason,
    howToGetThere: p.how_to_get_there,
    tip: p.tip,
    source: p.source,
    // 웹 검색 확인은 작업 6에서 연결한다. 그전에는 모두 "확인 안 됨"으로 표시한다.
    verified: false,
    // 좌표는 작업 12(장소 이름 → 좌표 변환)에서 채운다.
    position: null,
    mapNote: null,
  };
}

/** AI 답변을 화면용 응답으로 바꾼다. 장소 수 제한(최대 3곳)은 코드로 한 번 더 지킨다. */
function toChatResponse(answer: ModelAnswer): ChatResponse {
  return {
    kind: answer.kind,
    reply: answer.reply,
    places: answer.places.slice(0, MAX_ANSWER_PLACES).map(toPlace),
    itinerary: null,
  };
}

/** 최근 대화를 OpenAI에 보내 Haru의 답변(글 + 장소 목록)을 받는다. */
export async function askHaru(messages: ChatMessage[]): Promise<ChatResponse> {
  const response = await getClient().responses.create({
    model: OPENAI_MODEL,
    instructions: buildInstructions(),
    input: messages.map((m) => ({ role: m.role, content: m.content })),
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
  return toChatResponse(answer);
}
