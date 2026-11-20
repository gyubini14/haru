// 사용자에게 보여 주는 영어 안내 문구 모음 (PRD·DESIGN.md 8번)
// PRD에 없는 문구는 설계 제안이므로 개발 중에 확정한다.

export const MESSAGES = {
  /** PRD 7번 */
  rateLimited: "Too many requests. Please try again in a minute.",
  /** PRD 5번 M1 규칙 7 */
  askInEnglish: "Please ask in English.",
  /** 설계 제안 */
  tooLong: "Please keep your message within 300 characters.",
  /** 설계 제안 */
  invalidRequest: "Sorry, I couldn't read that request. Please try again.",
  /** 설계 제안: 웹 검색으로 확인된 장소가 하나도 없을 때 */
  noConfirmedPlaces:
    "I couldn't confirm specific places for that yet. Could you tell me the area or what you're looking for?",
  /** 설계 제안: 주제 밖 질문을 거절하며 도울 수 있는 주제를 안내 (PRD M1 규칙 6) */
  offTopic:
    "Sorry, I can't help with that. I can help with food, places to stay, transport, photo spots, K-drama and idol filming locations, and day plans in Korea.",
  /** 설계 제안: 숙소 추천에 필요한 정보 (PRD M1 규칙 4) */
  accommodationItems: {
    area: "the area you'd like to stay in",
    budget: "your budget per night",
    guests: "the number of guests",
  },
  /** 설계 제안: 빠진 정보를 모두 한 번에 되묻는 문장 */
  askAccommodationInfo: (missing: string[]) => {
    const list =
      missing.length === 1
        ? missing[0]
        : `${missing.slice(0, -1).join(", ")} and ${missing[missing.length - 1]}`;
    return `To recommend a place to stay, could you tell me ${list}?`;
  },
  /** PRD 7번: 출처 확인 안내 */
  checkSource:
    "Please check the original source for terms and latest details.",
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
