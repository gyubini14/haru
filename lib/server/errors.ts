// Design Ref: §4.4 — 오류 응답은 항상 { error: { code, message } } 한 가지 모양으로 보낸다.
import type { ERROR_CODES } from "@/lib/messages";
import type { ApiError } from "@/lib/types";

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/** 서버 API가 쓰는 오류 응답. message는 사용자에게 그대로 보이는 영어 문구다. */
export function errorResponse(
  status: number,
  code: ErrorCode,
  message: string,
): Response {
  const body: ApiError = { error: { code, message } };
  return Response.json(body, { status });
}
