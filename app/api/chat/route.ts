// Design Ref: §4.4 — 서버 API는 POST /api/chat 하나만 둔다.
import { ERROR_CODES, MESSAGES } from "@/lib/messages";
import { errorResponse } from "@/lib/server/errors";
import { askHaru } from "@/lib/server/openai";
import { validateChatRequest } from "@/lib/server/validate";

export async function POST(request: Request) {
  // 1) 요청 모양 검사 (최근 10턴만 남김)
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, ERROR_CODES.invalidRequest, MESSAGES.invalidRequest);
  }
  const messages = validateChatRequest(body);
  if (!messages) {
    return errorResponse(400, ERROR_CODES.invalidRequest, MESSAGES.invalidRequest);
  }

  // 2) AI 호출. 대화 내용은 기록하지 않고, 실패하면 오류 종류만 남긴다.
  try {
    return Response.json(await askHaru(messages));
  } catch (error) {
    console.error(
      "chat: AI request failed:",
      error instanceof Error ? error.name : "unknown",
    );
    return errorResponse(502, ERROR_CODES.aiFailure, MESSAGES.aiFailure);
  }
}
