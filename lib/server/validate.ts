import { z } from "zod";
import {
  MAX_HISTORY_MESSAGES,
  MAX_HISTORY_MESSAGE_CHARS,
  MAX_MESSAGE_LENGTH,
} from "@/lib/constants";
import { isInKorea, roundPosition } from "@/lib/geo";
import type { ChatMessage, Position } from "@/lib/types";

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1),
      }),
    )
    .min(1),
  // "내 위치 사용"을 켠 경우에만 온다. 모양이 틀리면 잘못된 요청으로 본다.
  location: z
    .object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) })
    .optional(),
});

export type ValidationResult =
  | { ok: true; messages: ChatMessage[]; location: Position | null }
  | { ok: false; reason: "invalid" | "too_long" };

/**
 * 글자의 절반 이상이 영문이 아니면 영어 질문이 아니라고 본다. (예: 한국어만 쓴 질문)
 * "Where is 광장시장?"처럼 영어에 한글 이름이 섞인 질문은 영어로 본다.
 * 스페인어처럼 영문 글자를 쓰는 다른 언어는 여기서 못 걸러내고 AI 지침(M1 규칙 7)이 처리한다.
 */
export function isMostlyNonEnglish(text: string): boolean {
  const letters = text.match(/\p{L}/gu) ?? [];
  if (letters.length === 0) return false;
  const latin = letters.filter((ch) => /\p{Script=Latin}/u.test(ch)).length;
  return latin / letters.length < 0.5;
}

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

  // 위치는 화면에서 줄여 보내지만, 정밀 좌표를 직접 보내도 그대로 쓰지 않도록 서버에서 한 번 더 줄인다.
  // 한국 밖 좌표는 쓸 수 없으므로 없는 것으로 본다. (PRD 7번)
  const rounded = parsed.data.location ? roundPosition(parsed.data.location) : null;
  const location = rounded && isInKorea(rounded) ? rounded : null;

  return { ok: true, messages, location };
}
