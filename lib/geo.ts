// 좌표 계산 도우미. 화면(브라우저)과 서버가 함께 쓴다. (Design Ref: §4.3 내 위치 사용)

import type { Position } from "@/lib/types";

// 한국 안쪽(제주·울릉도·독도 포함)인지 확인하는 대략적인 범위.
const KOREA_BOUNDS = { minLat: 33.0, maxLat: 38.7, minLng: 124.5, maxLng: 131.9 };

export function isInKorea(p: Position): boolean {
  return (
    p.lat >= KOREA_BOUNDS.minLat &&
    p.lat <= KOREA_BOUNDS.maxLat &&
    p.lng >= KOREA_BOUNDS.minLng &&
    p.lng <= KOREA_BOUNDS.maxLng
  );
}

/** 소수점 둘째 자리로 줄인다. 약 1km 범위가 되어 정확한 위치를 알 수 없다. (PRD 7번) */
export function roundPosition(p: Position): Position {
  return { lat: Math.round(p.lat * 100) / 100, lng: Math.round(p.lng * 100) / 100 };
}

/** 두 지점 사이의 거리(km). 하버사인 공식 */
export function distanceKm(a: Position, b: Position): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}
