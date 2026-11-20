"use client";

// Design Ref: §3 — 지도는 브라우저 전용 키(NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)로 Google Maps JavaScript API만 쓴다.
// 작업 11: 지도 표시만 한다. 장소 마커는 작업 13에서 추가한다.

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useEffect, useRef, useState } from "react";

// 처음 보여 주는 위치: 서울 시청 근처
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };
const DEFAULT_ZOOM = 11;

let optionsSet = false;

type Status = "loading" | "ready" | "unavailable";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  // 키가 없으면 처음부터 "사용 불가"로 시작한다
  const [status, setStatus] = useState<Status>(MAPS_KEY ? "loading" : "unavailable");

  useEffect(() => {
    const key = MAPS_KEY;
    if (!key) return;

    let cancelled = false;
    // 스크립트 옵션은 앱 전체에서 한 번만 설정한다 (개발 중 다시 마운트돼도 안전하게)
    if (!optionsSet) {
      setOptions({ key, v: "weekly", language: "en" });
      optionsSet = true;
    }

    importLibrary("maps")
      .then(({ Map }) => {
        if (cancelled || !containerRef.current) return;
        new Map(containerRef.current, {
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          // 작은 화면에서도 쓰기 쉽게 불필요한 조작 버튼을 줄인다
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });
        setStatus("ready");
      })
      .catch(() => {
        // 키 오류·네트워크 오류 시 지도만 안 보이고 채팅은 그대로 쓴다 (키 값은 로그에 남기지 않음)
        if (!cancelled) setStatus("unavailable");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative h-full w-full bg-zinc-100 dark:bg-zinc-900">
      <div ref={containerRef} className="h-full w-full" aria-label="Map of Korea" />
      {status !== "ready" && (
        <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          {status === "loading" ? "Loading map…" : "The map is not available right now."}
        </p>
      )}
    </div>
  );
}
