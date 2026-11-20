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
  /** PRD M2 규칙 3: 웹 검색으로 확인된 촬영지가 없을 때 ("정보가 없습니다") */
  noFilmingLocations:
    "I couldn't find confirmed filming locations for that. You could try another drama, film or artist.",
  /** 설계 제안: AI가 방문 팁을 비워 두었을 때 촬영지 카드에 쓰는 일반 팁 (PRD M2 규칙 2) */
  defaultFilmingTip:
    "Check access and visiting hours before you go, because filming spots can change or close.",
  /** 설계 제안: 촬영지 질문에서 작품·가수를 말하지 않았을 때 되묻는 문구 */
  askWhichWork:
    "Which drama, film or artist are you interested in? Tell me a title or a name and I'll look for its filming locations.",
  /** PRD M2 규칙 4: 촬영지에는 이웃을 배려하라는 주의사항을 함께 전달 */
  filmingEtiquette:
    "Please be quiet and respectful of nearby residents, and do not enter private property or film without permission.",
  /** PRD 6번: 내 위치 반경 2km 안에 확인된 장소가 없을 때 */
  noPlacesNearby:
    "No places within 2 km of your location. You can turn off location sharing to search other areas.",
  /** PRD 7번: 내 위치 안내 문구 (켜 둔 동안 화면에 표시) */
  locationNotice: "Your location is used only to find nearby places and is not stored.",
  /** 설계 제안: 내 위치 버튼 이름과 상태 */
  useMyLocation: "Use my location",
  stopUsingLocation: "Stop using my location",
  gettingLocation: "Getting your location…",
  /** PRD 6번: 거절·실패 시 지역 이름을 직접 입력하도록 안내 */
  locationDenied:
    "We couldn't get your location. You can type an area name instead, for example Hongdae.",
  /** 설계 제안: 한국 밖에서는 근처 추천이 의미 없으므로 안내 */
  locationOutsideKorea:
    "Your location seems to be outside Korea, so it won't be used. You can type an area name instead.",
  /** PRD 5번: Google 장소 검색으로 좌표를 확인하지 못했을 때 장소 카드 아래에 보이는 이유 */
  noMapLocation: "its exact location could not be confirmed.",
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
