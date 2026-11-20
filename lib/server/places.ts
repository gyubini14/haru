// Design Ref: §4.5 — 장소 이름 + 지역 → 좌표. Google 장소 검색(Places API New)을 서버에서만 호출한다.
// 키(GOOGLE_PLACES_API_KEY)는 지도 표시용 키와 분리되어 있고, 값은 코드·로그에 남기지 않는다.
// PRD 5번: 확인되지 않은 위치는 지어내지 않고, 지도에 표시하지 않은 채 이유만 안내한다.

import { MAX_MAP_PLACES } from "@/lib/constants";
// 한국 밖 좌표는 엉뚱한 나라의 같은 이름 장소이므로 걸러낸다
import { isInKorea } from "@/lib/geo";
import { MESSAGES } from "@/lib/messages";
import type { Place, Position } from "@/lib/types";

const TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const PLACES_TIMEOUT_MS = 5000;

/** "이름 + 지역"으로 검색해 좌표를 찾는다. 못 찾거나 오류면 null (예외를 던지지 않는다). */
async function findPosition(name: string, area: string): Promise<Position | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(TEXT_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        // 필요한 항목만 요청해 비용을 줄인다
        "X-Goog-FieldMask": "places.location",
      },
      body: JSON.stringify({
        textQuery: `${name}, ${area}, South Korea`,
        regionCode: "KR",
        languageCode: "en",
        maxResultCount: 1,
      }),
      signal: AbortSignal.timeout(PLACES_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) {
      // 응답 본문에 키 관련 정보가 있을 수 있어 상태 코드만 남긴다
      console.error("places lookup failed:", res.status);
      return null;
    }
    const data = (await res.json()) as {
      places?: { location?: { latitude?: number; longitude?: number } }[];
    };
    const loc = data.places?.[0]?.location;
    if (typeof loc?.latitude !== "number" || typeof loc?.longitude !== "number") return null;
    const position = { lat: loc.latitude, lng: loc.longitude };
    return isInKorea(position) ? position : null;
  } catch (e) {
    console.error("places lookup error:", e instanceof Error ? e.name : "unknown");
    return null;
  }
}

const NEARBY_URL = "https://places.googleapis.com/v1/places:searchNearby";

/** 가까운 곳 하나를 이름으로 찾는다. 못 찾거나 오류면 null. (types가 없으면 종류 제한 없음) */
async function nearestPlaceName(
  location: Position,
  includedTypes: string[] | null,
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(NEARBY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.displayName",
      },
      body: JSON.stringify({
        ...(includedTypes ? { includedTypes } : {}),
        maxResultCount: 1,
        rankPreference: "DISTANCE",
        languageCode: "en",
        locationRestriction: {
          circle: {
            center: { latitude: location.lat, longitude: location.lng },
            radius: 1500,
          },
        },
      }),
      signal: AbortSignal.timeout(PLACES_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("nearby lookup failed:", res.status);
      return null;
    }
    const data = (await res.json()) as { places?: { displayName?: { text?: string } }[] };
    return data.places?.[0]?.displayName?.text?.slice(0, 80) ?? null;
  } catch (e) {
    console.error("nearby lookup error:", e instanceof Error ? e.name : "unknown");
    return null;
  }
}

/**
 * 내 위치 근처를 영어로 설명할 말을 만든다. 예: "Hongik Univ. Station".
 * 웹 검색 도구는 좌표를 이해하지 못하고 질문 글만 검색어로 쓰기 때문에, "near me" 같은 질문에는
 * 가까운 지하철역(없으면 가까운 장소) 이름을 알려 줘야 그 주변 장소가 검색된다.
 * 좌표 자체는 AI 검색에 넘기지 않는다.
 */
export async function describeLocation(location: Position): Promise<string | null> {
  const station = await nearestPlaceName(location, ["subway_station", "train_station"]);
  if (station) return /station/i.test(station) ? station : `${station} Station`;
  return nearestPlaceName(location, null);
}

/**
 * 장소 목록의 좌표를 채운다. 여러 곳을 동시에 찾고, 못 찾은 곳은 position=null과 이유(mapNote)를 남긴다.
 * 지도에는 최대 MAX_MAP_PLACES곳만 올리므로 그 이후는 찾지 않는다.
 */
export async function attachPositions(places: Place[]): Promise<Place[]> {
  return Promise.all(
    places.map(async (place, i) => {
      if (i >= MAX_MAP_PLACES) return place;
      const position = await findPosition(place.name, place.area);
      return position
        ? { ...place, position, mapNote: null }
        : { ...place, position: null, mapNote: MESSAGES.noMapLocation };
    }),
  );
}
