// 숫자 규칙 모음 (PRD 5·6·7번). 규칙을 바꿀 때는 이 파일의 값만 고친다.

/** 질문 한 건의 최대 글자 수 (PRD 7번 악용 방지) */
export const MAX_MESSAGE_LENGTH = 300;

/** AI에 함께 보내는 최근 대화 턴 수. 1턴 = 질문 1개 + 답변 1개 (PRD 6번) */
export const MAX_HISTORY_TURNS = 10;

/** 최근 10턴에 해당하는 최대 메시지 수 */
export const MAX_HISTORY_MESSAGES = MAX_HISTORY_TURNS * 2;

/** 이전 답변(Haru가 한 말)에 허용하는 최대 글자 수. 비용 폭증 방지용 안전장치 */
export const MAX_HISTORY_MESSAGE_CHARS = 4000;

/** 사용자(IP)당 분당 질문 횟수 (PRD 7번, 시작값이며 개발 중 조정) */
export const RATE_LIMIT_PER_MINUTE = 10;

/** 추천·촬영지 답변에서 보여 주는 최대 장소 수 (PRD M1·M2) */
export const MAX_ANSWER_PLACES = 3;

/** 하루 일정에 들어가는 장소 수 범위 (PRD N1) */
export const MIN_ITINERARY_PLACES = 3;
export const MAX_ITINERARY_PLACES = 5;

/** 하루 일정에서 장소 사이 이동 시간 상한(분, 대중교통 기준) (PRD N1) */
export const MAX_TRANSIT_MINUTES = 30;

/** 지도에 한 번에 표시하는 최대 장소 수 (PRD N3) */
export const MAX_MAP_PLACES = 5;

/** "내 위치 사용" 시 근처 추천 반경(km) (PRD 6번) */
export const NEARBY_RADIUS_KM = 2;

/** 사용하는 OpenAI 모델 (PRD 8번: GPT-4o mini급) */
export const OPENAI_MODEL = "gpt-4o-mini";

/** OpenAI 응답을 기다리는 최대 시간(ms). PRD 응답 시간 목표(20초)에 맞춘다 */
export const OPENAI_TIMEOUT_MS = 20_000;

/** 질문 분류 단계의 제한 시간(ms)과 최대 출력 길이(토큰). 가볍고 빨라야 한다 */
export const TRIAGE_TIMEOUT_MS = 8_000;
export const TRIAGE_MAX_OUTPUT_TOKENS = 200;

/** AI 답변 최대 출력 길이(토큰). 응답 시간과 비용을 줄이기 위한 제한 */
export const OPENAI_MAX_OUTPUT_TOKENS = 1500;

/** 하루 일정은 장소가 많아 출력이 길어서 별도로 늘린다 */
export const OPENAI_ITINERARY_MAX_OUTPUT_TOKENS = 2500;
