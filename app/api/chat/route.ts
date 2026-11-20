// Design Ref: §4.4 — 서버 API는 POST /api/chat 하나만 둔다.
import { ERROR_CODES, MESSAGES } from "@/lib/messages";
import { errorResponse } from "@/lib/server/errors";
import { askHaru } from "@/lib/server/openai";
import { checkRateLimit } from "@/lib/server/rateLimit";
import { validateChatRequest } from "@/lib/server/validate";

/** 사용자(IP)를 구분할 값. 횟수를 세는 1분 동안만 서버 메모리에 두고 저장·기록하지 않는다. */
function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0].trim() || "unknown";
}

export async function POST(request: Request) {
  // 1) 분당 횟수 제한 (잘못된 요청도 횟수에 포함해 반복 호출을 막는다)
  if (!checkRateLimit(clientKey(request))) {
    return errorResponse(429, ERROR_CODES.rateLimited, MESSAGES.rateLimited);
  }

  // 2) 요청 모양과 글자 수 검사 (최근 10턴만 남김)
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, ERROR_CODES.invalidRequest, MESSAGES.invalidRequest);
  }
  const validated = validateChatRequest(body);
  if (!validated.ok) {
    return validated.reason === "too_long"
      ? errorResponse(400, ERROR_CODES.messageTooLong, MESSAGES.tooLong)
      : errorResponse(400, ERROR_CODES.invalidRequest, MESSAGES.invalidRequest);
  }

  // 3) AI 호출. 대화 내용은 기록하지 않고, 실패하면 오류 종류만 남긴다.
  try {
    return Response.json(await askHaru(validated.messages));
  } catch (error) {
    console.error(
      "chat: AI request failed:",
      error instanceof Error ? error.name : "unknown",
    );
    return errorResponse(502, ERROR_CODES.aiFailure, MESSAGES.aiFailure);
  }
}
