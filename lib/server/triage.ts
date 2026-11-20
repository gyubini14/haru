import { z } from "zod";
import { OPENAI_MODEL, TRIAGE_MAX_OUTPUT_TOKENS, TRIAGE_TIMEOUT_MS } from "@/lib/constants";
import { getOpenAIClient } from "@/lib/server/openaiClient";
import { TRIAGE_INSTRUCTIONS } from "@/lib/server/prompts";
import type { ChatMessage } from "@/lib/types";

// 분류 단계: 웹 검색 전에 질문을 먼저 가볍게 분류한다.
// 영어가 아닌 질문(M1 규칙 7), 주제 밖 질문(규칙 6), 숙소 정보 부족(규칙 4)은 이 단계에서 코드가 처리하므로
// 검색 비용과 시간이 들지 않고, AI가 규칙을 못 지켜도 결과가 흔들리지 않는다.
const triageSchema = z.object({
  is_english: z.boolean(),
  topic: z.enum([
    "accommodation",
    "food",
    "transport",
    "photo_spot",
    "filming_location",
    "day_plan",
    "greeting",
    "other",
  ]),
  area_known: z.boolean(),
  budget_known: z.boolean(),
  guests_known: z.boolean(),
  /** 숙소·촬영지 질문일 때, 한국인 블로그·커뮤니티·후기를 찾기 위한 한국어 검색어 */
  korean_search_query: z.string().nullable(),
  /** 촬영지 질문에서 사용자가 말한 드라마·영화·가수·그룹의 영어 이름 (없으면 null) */
  named_work: z.string().nullable(),
  /** 교통 질문에서 출발지와 도착지가 둘 다 분명할 때만 채운다. 지도에 A, B 마커로 표시한다 (이동 경로선은 없다) */
  route: z
    .object({
      from_name: z.string(),
      from_area: z.string(),
      to_name: z.string(),
      to_area: z.string(),
    })
    .nullable(),
});

export type Triage = z.infer<typeof triageSchema>;

const triageJsonSchema = z.toJSONSchema(triageSchema) as Record<string, unknown>;
delete triageJsonSchema.$schema; // OpenAI는 이 항목을 받지 않는다

/** 최근 대화를 보고 질문을 분류한다. 실패하면 오류를 던진다. */
export async function triage(messages: ChatMessage[]): Promise<Triage> {
  const response = await getOpenAIClient().responses.create(
    {
      model: OPENAI_MODEL,
      instructions: TRIAGE_INSTRUCTIONS,
      input: messages.map((m) => ({ role: m.role, content: m.content })),
      max_output_tokens: TRIAGE_MAX_OUTPUT_TOKENS,
      text: {
        format: { type: "json_schema", name: "haru_triage", strict: true, schema: triageJsonSchema },
      },
    },
    { timeout: TRIAGE_TIMEOUT_MS },
  );
  return triageSchema.parse(JSON.parse(response.output_text));
}
