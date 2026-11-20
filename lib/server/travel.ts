// 작업 16: 하루 일정의 이동 시간을 현실적으로 보정한다. (PRD N1: 장소 사이 이동은 대중교통 30분 이내)
// AI가 적은 이동 시간은 지도 거리를 모르고 쓴 값이라, 직선거리로도 불가능한 값(예: 13km를 15분)이 자주 나온다.
// 그래서 확보한 좌표로 거리를 재서, 너무 빠르게 적힌 값만 계산값으로 바꾼다.

import { MAX_TRANSIT_MINUTES } from "@/lib/constants";
import { distanceKm } from "@/lib/geo";
import type { ItineraryStop } from "@/lib/types";

// 직선거리 대비 실제 도로·노선 거리 배율, 걷는 속도(km/h), 대중교통 평균 속도(km/h)와 기다리는 시간(분)
const ROAD_FACTOR = 1.3;
const WALK_KMH = 4.8;
const TRANSIT_KMH = 28;
const TRANSIT_WAIT_MIN = 8;
// 계산값보다 이만큼 이상 빠르게 적힌 것만 "비현실적"으로 보고 바꾼다 (조금 빠른 정도는 AI 값을 존중)
const IMPLAUSIBLE_RATIO = 0.7;

// 걸어서 이 시간(분) 이하의 거리는 걷는 것으로 본다. 계산값보다 이만큼 이상 느리게 적힌 대중교통 값도 바꾼다.
const SHORT_WALK_MIN = 15;
const EXAGGERATED_RATIO = 1.8;

function withMinutes(stop: ItineraryStop, mode: string, minutes: number): ItineraryStop {
  return { ...stop, travelToNext: { mode, minutes: Math.max(1, minutes) } };
}

function walkMinutes(km: number): number {
  return Math.round(((km * ROAD_FACTOR) / WALK_KMH) * 60);
}

function transitMinutes(km: number): number {
  return Math.round(TRANSIT_WAIT_MIN + ((km * ROAD_FACTOR) / TRANSIT_KMH) * 60);
}

/** 다음 장소까지의 이동 안내를 좌표 거리에 맞게 바로잡는다. 좌표가 없으면 그대로 둔다. */
export function fixTravelTimes(stops: ItineraryStop[]): ItineraryStop[] {
  return stops.map((stop, i) => {
    const next = stops[i + 1];
    const travel = stop.travelToNext;
    if (!travel || !next || !stop.place.position || !next.place.position) return stop;

    const km = distanceKm(stop.place.position, next.place.position);
    const walk = walkMinutes(km);

    // 걸어서 15분 이내의 가까운 거리는 걷는 것으로 안내한다 ("0.6km를 지하철 20분" 같은 값 방지)
    if (walk <= SHORT_WALK_MIN) {
      return { ...stop, travelToNext: { mode: "walk", minutes: Math.max(1, walk) } };
    }

    // 걸어서 30분을 넘는 거리인데 걷는다고 적었으면 대중교통으로 바꿔 안내한다
    if (/walk/i.test(travel.mode)) {
      if (walk > MAX_TRANSIT_MINUTES) {
        return { ...stop, travelToNext: { mode: "public transit", minutes: transitMinutes(km) } };
      }
      return travel.minutes < walk * IMPLAUSIBLE_RATIO ? withMinutes(stop, travel.mode, walk) : stop;
    }

    // 대중교통: 거리상 불가능하게 빠르거나, 터무니없이 느리게 적힌 값만 계산값으로 바꾼다
    const est = transitMinutes(km);
    if (travel.minutes < est * IMPLAUSIBLE_RATIO || travel.minutes > est * EXAGGERATED_RATIO) {
      return withMinutes(stop, travel.mode, est);
    }
    return stop;
  });
}
