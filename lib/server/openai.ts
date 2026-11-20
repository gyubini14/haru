import OpenAI from "openai";
import {
  OPENAI_MAX_OUTPUT_TOKENS,
  OPENAI_MODEL,
  OPENAI_TIMEOUT_MS,
} from "@/lib/constants";
import { BASE_INSTRUCTIONS } from "@/lib/server/prompts";
import type { ChatMessage, ChatResponse } from "@/lib/types";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  // 키는 서버 환경 변수에서만 읽는다. 값을 출력하거나 기록하지 않는다.
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  // 자동 재시도는 하지 않는다. 재시도하면 응답 시간 목표(20초)를 넘기기 쉽다.
  client ??= new OpenAI({ apiKey, timeout: OPENAI_TIMEOUT_MS, maxRetries: 0 });
  return client;
}

/** 최근 대화를 OpenAI에 보내 Haru의 영어 답변을 받는다. */
export async function askHaru(messages: ChatMessage[]): Promise<ChatResponse> {
  const response = await getClient().responses.create({
    model: OPENAI_MODEL,
    instructions: BASE_INSTRUCTIONS,
    input: messages.map((m) => ({ role: m.role, content: m.content })),
    max_output_tokens: OPENAI_MAX_OUTPUT_TOKENS,
  });

  const reply = response.output_text.trim();
  if (!reply) throw new Error("empty answer");

  // 장소 목록은 작업 4에서 채운다. 지금은 글 답변만 돌려준다.
  return { kind: "answer", reply, places: [], itinerary: null };
}
