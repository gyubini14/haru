"use client";

// 작업 14: "내 위치 사용" (PRD 6·7번)
// - 사용자가 버튼을 눌러 브라우저가 허용한 경우에만 위치를 쓴다.
// - 좌표는 소수점 둘째 자리(약 1km)로 줄여 메모리에만 두고, 저장하지 않는다.
// - 켜 둔 동안 모든 질문에 쓰고, 끄는 버튼으로 언제든 끌 수 있다.

import { useCallback, useState } from "react";
import { isInKorea, roundPosition } from "@/lib/geo";
import type { Position } from "@/lib/types";

export type LocationStatus = "off" | "getting" | "on" | "denied" | "outside";

export function useLocation() {
  const [status, setStatus] = useState<LocationStatus>("off");
  const [position, setPosition] = useState<Position | null>(null);

  /** 켜기/끄기. 켜는 순간 브라우저가 허용 여부를 묻는다. */
  const toggle = useCallback(() => {
    if (status === "on" || status === "getting") {
      setStatus("off");
      setPosition(null);
      return;
    }
    if (!("geolocation" in navigator)) {
      setStatus("denied");
      return;
    }
    setStatus("getting");
    navigator.geolocation.getCurrentPosition(
      (result) => {
        // 정확한 좌표는 여기서 바로 줄여서 쓴다
        const rounded = roundPosition({ lat: result.coords.latitude, lng: result.coords.longitude });
        if (!isInKorea(rounded)) {
          setStatus("outside");
          setPosition(null);
          return;
        }
        setPosition(rounded);
        setStatus("on");
      },
      () => {
        // 거절·시간 초과·오류 모두 같은 안내로 처리한다 (지역 이름을 직접 입력하는 기본 흐름)
        setStatus("denied");
        setPosition(null);
      },
      { timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  }, [status]);

  return { status, position, toggle };
}

export type LocationControl = ReturnType<typeof useLocation>;
