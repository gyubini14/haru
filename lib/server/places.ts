// Design Ref: §4.5 — 장소 이름 + 지역 → 좌표. Google 장소 검색(Places API New)을 서버에서만 호출한다.
// 키(GOOGLE_PLACES_API_KEY)는 지도 표시용 키와 분리되어 있고, 값은 코드·로그에 남기지 않는다.
// PRD 5번: 확인되지 않은 위치는 지어내지 않고, 지도에 표시하지 않은 채 이유만 안내한다.

import { MAX_MAP_PLACES } from "@/lib/constants";
// 한국 밖 좌표는 엉뚱한 나라의 같은 이름 장소이므로 걸러낸다
import { distanceKm, isInKorea } from "@/lib/geo";
import { MESSAGES } from "@/lib/messages";
import type { Place, PlacePhoto, Position, RouteEnds, RoutePoint } from "@/lib/types";

const TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const PLACES_TIMEOUT_MS = 5000;

type RawPlace = {
  displayName?: { text?: string };
  photos?: { name?: string; authorAttributions?: { displayName?: string; uri?: string }[] }[];
  location?: { latitude?: number; longitude?: number };
  viewport?: {
    low?: { latitude?: number; longitude?: number };
    high?: { latitude?: number; longitude?: number };
  };
};

/** Google 장소 검색(텍스트)으로 가장 잘 맞는 1곳을 찾는다. 못 찾거나 오류면 null (예외를 던지지 않는다). */
async function searchText(
  textQuery: string,
  fieldMask: string,
  bias?: { center: Position; radiusM: number },
  languageCode = "en",
): Promise<RawPlace | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(TEXT_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        // 필요한 항목만 요청해 비용을 줄인다
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify({
        textQuery,
        regionCode: "KR",
        languageCode,
        maxResultCount: 1,
        // 적힌 지역 근처를 우선해서 찾는다 (같은 이름의 다른 지점이 잡히는 것을 줄인다)
        ...(bias
          ? {
              locationBias: {
                circle: {
                  center: { latitude: bias.center.lat, longitude: bias.center.lng },
                  radius: bias.radiusM,
                },
              },
            }
          : {}),
      }),
      signal: AbortSignal.timeout(PLACES_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) {
      // 응답 본문에 키 관련 정보가 있을 수 있어 상태 코드만 남긴다
      console.error("places lookup failed:", res.status);
      return null;
    }
    const data = (await res.json()) as { places?: RawPlace[] };
    return data.places?.[0] ?? null;
  } catch (e) {
    console.error("places lookup error:", e instanceof Error ? e.name : "unknown");
    return null;
  }
}

function toPosition(loc: RawPlace["location"]): Position | null {
  if (typeof loc?.latitude !== "number" || typeof loc?.longitude !== "number") return null;
  const position = { lat: loc.latitude, lng: loc.longitude };
  return isInKorea(position) ? position : null;
}

/** 지역(예: Gangnam)의 중심과 크기. 장소가 적힌 지역과 다른 곳으로 잡히는지 확인하는 데 쓴다. */
interface AreaInfo {
  center: Position;
  /** 지역 크기의 절반(km). 서울처럼 넓은 곳은 크고, 동네는 작다 */
  halfSizeKm: number;
}

async function findArea(area: string): Promise<AreaInfo | null> {
  if (!area.trim()) return null;
  const raw = await searchText(`${area}, South Korea`, "places.location,places.viewport");
  const center = toPosition(raw?.location);
  if (!raw || !center) return null;
  const low = raw.viewport?.low;
  const high = raw.viewport?.high;
  const halfSizeKm =
    typeof low?.latitude === "number" &&
    typeof low?.longitude === "number" &&
    typeof high?.latitude === "number" &&
    typeof high?.longitude === "number"
      ? distanceKm(
          { lat: low.latitude, lng: low.longitude },
          { lat: high.latitude, lng: high.longitude },
        ) / 2
      : 0;
  return { center, halfSizeKm };
}

const PHOTO_BASE_URL = "https://places.googleapis.com/v1";
const PHOTO_WIDTH_PX = 640;

/**
 * 장소의 대표 사진 1장의 주소와 촬영자 표기를 받는다. 못 받으면 null (사진만 빠지고 답변은 그대로 간다).
 * skipHttpRedirect로 사진 주소(키가 들어 있지 않은 주소)만 받아서, API 키가 브라우저에 노출되지 않게 한다.
 */
async function fetchPhoto(raw: RawPlace | null): Promise<PlacePhoto | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const photo = raw?.photos?.[0];
  // 사진 이름이 예상한 모양이 아니면 요청하지 않는다 (주소를 이어 붙이므로 안전하게 확인)
  if (!apiKey || !photo?.name || !/^places\/[\w-]+\/photos\/[\w-]+$/.test(photo.name)) return null;
  try {
    const res = await fetch(
      `${PHOTO_BASE_URL}/${photo.name}/media?maxWidthPx=${PHOTO_WIDTH_PX}&skipHttpRedirect=true`,
      { headers: { "X-Goog-Api-Key": apiKey }, signal: AbortSignal.timeout(PLACES_TIMEOUT_MS), cache: "no-store" },
    );
    if (!res.ok) {
      console.error("photo lookup failed:", res.status);
      return null;
    }
    const data = (await res.json()) as { photoUri?: string };
    // Google 사진 서버의 https 주소만 사용한다
    if (!data.photoUri || !/^https:\/\/[\w.-]+\.googleusercontent\.com\//.test(data.photoUri)) return null;
    const author = photo.authorAttributions?.[0];
    const authorUrl = author?.uri && /^https:\/\/maps\.google\.com\//.test(author.uri) ? author.uri : null;
    return { url: data.photoUri, authorName: (author?.displayName ?? "Google Maps user").slice(0, 60), authorUrl };
  } catch (e) {
    console.error("photo lookup error:", e instanceof Error ? e.name : "unknown");
    return null;
  }
}

/** 같은 이름이라도 적힌 지역에서 이 거리(km)보다 멀리 떨어진 곳이면 다른 장소로 보고 확인 안 됨으로 처리한다 */
const MIN_AREA_TOLERANCE_KM = 12;

/**
 * "이름 + 지역"으로 검색해 좌표를 찾는다. 지역 근처를 우선해서 찾고,
 * 적힌 지역과 너무 먼 곳이 나오면 null로 처리한다. (DESIGN 4.1: 적힌 지역과 다르면 "확인 안 됨")
 */
async function findPosition(
  name: string,
  area: string,
  areaInfo: AreaInfo | null,
): Promise<{ position: Position; nameKo: string | null; photo: PlacePhoto | null } | null> {
  const bias = areaInfo
    ? {
        center: areaInfo.center,
        radiusM: Math.min(50_000, Math.max(5_000, areaInfo.halfSizeKm * 1000)),
      }
    : undefined;
  const query = `${name}, ${area}, South Korea`;
  const tolerance = areaInfo ? Math.max(MIN_AREA_TOLERANCE_KM, areaInfo.halfSizeKm * 1.2) : null;

  // 한국어로 요청해, 같은 장소의 한글 이름(Google이 알려 주는 표기)도 함께 받는다.
  // 한국어 검색이 실패하면(영어 이름만 아는 장소) 영어로 다시 찾고, 이때는 한글 이름 없이 좌표만 쓴다.
  for (const language of ["ko", "en"]) {
    const raw = await searchText(query, "places.location,places.displayName,places.photos", bias, language);
    const position = toPosition(raw?.location);
    if (!position) continue;
    if (areaInfo && tolerance !== null && distanceKm(areaInfo.center, position) > tolerance) continue;
    const ko = language === "ko" ? (raw?.displayName?.text?.trim() ?? "") : "";
    return {
      position,
      nameKo: /[가-힣]/.test(ko) ? ko.slice(0, 80) : null,
      // 좌표를 확인한 장소에만 사진을 붙인다 (다른 곳의 사진이 붙는 것을 줄인다)
      photo: await fetchPhoto(raw),
    };
  }
  return null;
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
  // 같은 지역 이름은 한 번만 찾는다 (일정은 대부분 같은 지역의 장소들이다)
  const areas = new Map<string, Promise<AreaInfo | null>>();
  const areaOf = (area: string) => {
    let found = areas.get(area);
    if (!found) {
      found = findArea(area);
      areas.set(area, found);
    }
    return found;
  };

  return Promise.all(
    places.map(async (place, i) => {
      if (i >= MAX_MAP_PLACES) return place;
      const found = await findPosition(place.name, place.area, await areaOf(place.area));
      return found
        ? { ...place, position: found.position, nameKo: found.nameKo, photo: found.photo, mapNote: null }
        : { ...place, position: null, mapNote: MESSAGES.noMapLocation };
    }),
  );
}

/**
 * 교통 질문의 출발지·도착지 좌표를 찾는다. 둘 중 하나라도 AI가 정하지 않았으면 null.
 * 좌표를 못 찾은 쪽은 position=null로 두어 지도에 표시하지 않는다. (이동 경로선은 그리지 않는다)
 */
export async function locateRoute(
  route: { from: { name: string; area: string }; to: { name: string; area: string } } | null,
): Promise<RouteEnds | null> {
  if (!route) return null;
  // 출발지나 도착지가 분명하지 않을 때 AI가 "unknown" 같은 말을 적는 경우가 있어, 그때는 표시하지 않는다
  const unclear = (n: string) => !n.trim() || /unknown|unspecified|not\s+(specified|clear|given)|n\/a|\bnone\b|current location|my location/i.test(n);
  if (unclear(route.from.name) || unclear(route.to.name)) return null;
  const locate = async (p: { name: string; area: string }): Promise<RoutePoint> => {
    const found = await findPosition(p.name, p.area, await findArea(p.area));
    return { name: p.name, nameKo: found?.nameKo ?? null, area: p.area, position: found?.position ?? null };
  };
  const [from, to] = await Promise.all([locate(route.from), locate(route.to)]);
  return { from, to };
}
