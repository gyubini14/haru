// 사용자에게 보여 주는 영어 안내 문구 모음 (PRD·DESIGN.md 8번)
// PRD에 없는 문구는 설계 제안이므로 개발 중에 확정한다.

export const MESSAGES = {
  /** PRD 7번 */
  rateLimited: "Too many requests. Please try again in a minute.",
  /** PRD 5번 M1 규칙 7 */
  askInEnglish: "Please ask in English.",
  /** 설계 제안 */
  tooLong: "Please keep your message under 300 characters.",
  /** 설계 제안 */
  invalidRequest: "Sorry, I couldn't read that request. Please try again.",
  /** 설계 제안 */
  aiFailure: "Sorry, something went wrong. Please try again.",
  /** PRD 7번 */
  privacyNotice:
    "Please don't enter personal information (passport or card numbers).",
  /** 설계 제안 */
  welcome:
    "Hi, I'm Haru! Ask me about food, stays, transport, photo spots, K-drama and idol filming locations, or a day plan in Korea.",
} as const;

export const ERROR_CODES = {
  invalidRequest: "INVALID_REQUEST",
  messageTooLong: "MESSAGE_TOO_LONG",
  rateLimited: "RATE_LIMITED",
  aiFailure: "AI_FAILURE",
} as const;
