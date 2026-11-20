import { z } from "zod";
import { MAX_HISTORY_MESSAGES } from "@/lib/constants";
import type { ChatMessage } from "@/lib/types";

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1),
      }),
    )
    .min(1),
});

/**
 * 요청 본문을 검사하고 최근 10턴(말풍선 최대 20개)만 남긴다. (Design Ref: §4.1 ③)
 * 마지막 메시지는 사용자의 질문이어야 한다. 글자 수·횟수 제한은 작업 5에서 추가한다.
 */
export function validateChatRequest(body: unknown): ChatMessage[] | null {
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return null;

  const messages = parsed.data.messages.slice(-MAX_HISTORY_MESSAGES);
  return messages[messages.length - 1].role === "user" ? messages : null;
}
