import { z } from "zod";
import {
  MAX_HISTORY_MESSAGES,
  MAX_HISTORY_MESSAGE_CHARS,
  MAX_MESSAGE_LENGTH,
} from "@/lib/constants";
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

export type ValidationResult =
  | { ok: true; messages: ChatMessage[] }
  | { ok: false; reason: "invalid" | "too_long" };

/**
 * 요청 본문을 검사하고 최근 10턴(말풍선 최대 20개)만 남긴다. (Design Ref: §4.1 ③)
 * - 마지막 메시지는 사용자의 질문이어야 한다.
 * - 사용자 질문은 300자 이하여야 한다. (PRD 7번 악용 방지)
 * - 이전 답변(Haru가 한 말)은 비용 폭증을 막기 위해 4000자 이하로 제한한다.
 */
export function validateChatRequest(body: unknown): ValidationResult {
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return { ok: false, reason: "invalid" };

  const messages = parsed.data.messages.slice(-MAX_HISTORY_MESSAGES);
  if (messages[messages.length - 1].role !== "user") {
    return { ok: false, reason: "invalid" };
  }

  for (const m of messages) {
    if (m.role === "user" && m.content.length > MAX_MESSAGE_LENGTH) {
      return { ok: false, reason: "too_long" };
    }
    // 너무 긴 이전 답변은 사용자가 쓴 글이 아니므로 "300자" 안내가 아니라 잘못된 요청으로 처리한다.
    if (m.role === "assistant" && m.content.length > MAX_HISTORY_MESSAGE_CHARS) {
      return { ok: false, reason: "invalid" };
    }
  }

  return { ok: true, messages };
}
