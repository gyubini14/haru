import OpenAI from "openai";
import { OPENAI_TIMEOUT_MS } from "@/lib/constants";

let client: OpenAI | null = null;

/** OpenAI 연결 (서버 전용). 키는 서버 환경 변수에서만 읽고, 값을 출력하거나 기록하지 않는다. */
export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  // 자동 재시도는 하지 않는다. 재시도하면 응답 시간 목표(20초)를 넘기기 쉽다.
  client ??= new OpenAI({ apiKey, timeout: OPENAI_TIMEOUT_MS, maxRetries: 0 });
  return client;
}
