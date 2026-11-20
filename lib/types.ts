// 서버와 화면이 주고받는 데이터의 모양 (DESIGN.md 5번)

export type Role = "user" | "assistant";

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface Position {
  lat: number;
  lng: number;
}

export interface Place {
  /** 장소 이름 (영어) */
  name: string;
  /** 장소 이름의 한글 표기. 현지에서 간판·지도 검색에 쓰도록 영어 이름과 함께 보여 준다. 모르면 null */
  nameKo: string | null;
  /** 지역 */
  area: string;
  /** 추천 이유 1문장 */
  reason: string;
  /** 가는 방법 1문장 */
  howToGetThere: string;
  /** 촬영지 방문 팁 (M2) */
  tip: string | null;
  /** 작품·가수 이름 (M2) */
  source: string | null;
  /** 웹 검색으로 확인했는지 */
  verified: boolean;
  /** 이 장소를 확인한 웹 검색 결과 주소 (확인된 경우에만) */
  sourceUrl: string | null;
  /** 출처가 한국 사이트(한국인 커뮤니티·블로그·예약 사이트)인지 */
  fromKoreanSource: boolean;
  /** 숙소의 예약 시 주의점 1문장 (숙소가 아니면 null) */
  bookingTips: string | null;
  /** 지도 좌표. 확인하지 못하면 null (좌표 변환은 작업 12에서 연결) */
  position: Position | null;
  /** 지도에 올리지 못한 이유 */
  mapNote: string | null;
}

export interface ItineraryStop {
  /** 방문 시간대. 예: "10:00-11:30" */
  time: string;
  place: Place;
  /** 다음 장소까지의 이동. 마지막 장소는 null */
  travelToNext: { mode: string; minutes: number } | null;
}

/**
 * answer: 일반 추천 / itinerary: 하루 일정 / clarify: 빠진 정보를 되물음 /
 * refusal: 주제 밖 질문 또는 영어 외 언어 안내
 */
export type ChatKind = "answer" | "itinerary" | "clarify" | "refusal";

export interface ChatRequest {
  messages: ChatMessage[];
  location?: Position;
}

export interface ChatResponse {
  kind: ChatKind;
  reply: string;
  places: Place[];
  itinerary: { stops: ItineraryStop[] } | null;
}

export interface ApiError {
  error: { code: string; message: string };
}
