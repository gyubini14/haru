"use client";

// Design Ref: §3 — 지도는 브라우저 전용 키(NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)로 Google Maps JavaScript API만 쓴다.
// 작업 11: 지도 표시 / 작업 13: 가장 최근 답변의 장소를 번호 마커로 표시 (최대 5곳)

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useEffect, useRef, useState } from "react";
import { MAX_MAP_PLACES } from "@/lib/constants";
import type { Position } from "@/lib/types";

// 처음 보여 주는 위치: 서울 시청 근처
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };
const DEFAULT_ZOOM = 11;
// 장소가 한 곳일 때 확대 정도
const SINGLE_PLACE_ZOOM = 15;

// 표시할 위치가 없을 때(검색 전, 새 대화)는 채도를 낮춘 흑백 지도, 위치를 표시하는 동안은 기본 컬러 지도
const IDLE_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { stylers: [{ saturation: -100 }, { lightness: 4 }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "water", stylers: [{ color: "#dcdcdc" }] },
];

// 마커 모양: 번호가 들어간 검은 원. 커서를 올리면 조금 커진다.
function markerIcon(scale: number): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale,
    fillColor: "#181818",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
  };
}
const MARKER_SCALE = 13;
const MARKER_SCALE_HOVER = 16;

/** 마커 위에 보여 줄 하얀 텍스트 블록: 영어 이름과 한글 이름. (글은 textContent로만 넣어 HTML로 해석하지 않는다) */
function tooltipContent(point: MapPoint): HTMLElement {
  const box = document.createElement("div");
  box.style.cssText =
    "background:#fff;color:#181818;padding:2px 4px;font:600 14px/1.35 system-ui,sans-serif;white-space:nowrap";
  const en = document.createElement("div");
  en.textContent = point.title;
  box.append(en);
  if (point.nameKo) {
    const ko = document.createElement("div");
    ko.textContent = point.nameKo;
    ko.style.cssText = "font-weight:400;font-size:13px;color:#767676";
    box.append(ko);
  }
  return box;
}

let optionsSet = false;

type Status = "loading" | "ready" | "unavailable";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

/** 지도에 올릴 한 지점. 라벨은 장소 카드 번호(1, 2, 3…)나 출발지·도착지(A, B)다. */
export interface MapPoint {
  position: Position;
  label: string;
  /** 영어 이름 */
  title: string;
  /** 한글 이름 (모르면 null) */
  nameKo: string | null;
}

interface MapViewProps {
  /** 가장 최근 답변의 지점들. 좌표가 있는 것만 마커로 올린다. */
  points: MapPoint[];
}

export function MapView({ points }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);
  // 키가 없으면 처음부터 "사용 불가"로 시작한다
  const [status, setStatus] = useState<Status>(MAPS_KEY ? "loading" : "unavailable");

  // 지도 만들기
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
        const created = new Map(containerRef.current, {
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          // 작은 화면에서도 쓰기 쉽게 불필요한 조작 버튼을 줄인다
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          // 처음에는 위치를 표시하기 전이므로 흑백 (표시할 위치가 생기면 아래 효과에서 컬러로 바꾼다)
          styles: IDLE_MAP_STYLES,
        });
        setMap(created);
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

  // 장소가 바뀌면 마커를 다시 그리고 지도 범위를 맞춘다
  useEffect(() => {
    if (!map) return;

    // 이전 마커와 이름 블록을 치운다
    infoRef.current?.close();
    for (const marker of markersRef.current) {
      google.maps.event.clearInstanceListeners(marker);
      marker.setMap(null);
    }
    markersRef.current = [];

    // 표시할 위치가 있으면 컬러, 없으면 흑백
    map.setOptions({ styles: points.length > 0 ? null : IDLE_MAP_STYLES });
    if (!infoRef.current) {
      infoRef.current = new google.maps.InfoWindow({
        headerDisabled: true,
        disableAutoPan: true,
        pixelOffset: new google.maps.Size(0, -12),
      });
    }
    const info = infoRef.current;

    const bounds = new google.maps.LatLngBounds();
    points.slice(0, MAX_MAP_PLACES).forEach((point) => {
      const marker = new google.maps.Marker({
        map,
        position: point.position,
        // 장소 카드의 번호(또는 출발지 A·도착지 B)를 검은 원 안에 표시한다
        icon: markerIcon(MARKER_SCALE),
        label: { text: point.label, color: "#ffffff", fontWeight: "600", fontSize: "12px" },
        zIndex: 1,
      });
      // 커서를 올리면 마커가 커지고 이름 블록이 뜬다. (터치 화면에서는 누르면 열고 닫는다)
      const show = () => {
        marker.setIcon(markerIcon(MARKER_SCALE_HOVER));
        marker.setZIndex(10);
        info.setContent(tooltipContent(point));
        info.open({ map, anchor: marker });
      };
      const hide = () => {
        marker.setIcon(markerIcon(MARKER_SCALE));
        marker.setZIndex(1);
        info.close();
      };
      marker.addListener("mouseover", show);
      marker.addListener("mouseout", hide);
      marker.addListener("click", show);
      markersRef.current.push(marker);
      bounds.extend(point.position);
    });

    const count = markersRef.current.length;
    if (count === 0) {
      // 표시할 위치가 없으면 처음 화면(서울 중심)으로 돌아간다
      map.setCenter(DEFAULT_CENTER);
      map.setZoom(DEFAULT_ZOOM);
    } else if (count === 1) {
      map.setCenter(bounds.getCenter());
      map.setZoom(SINGLE_PLACE_ZOOM);
    } else if (count > 1) {
      map.fitBounds(bounds, 48);
    }
  }, [map, points]);

  return (
    <div className="relative h-full w-full bg-soft">
      <div ref={containerRef} className="h-full w-full" aria-label="Map of Korea" />
      {status !== "ready" && (
        <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-mute">
          {status === "loading" ? "Loading map…" : "The map is not available right now."}
        </p>
      )}
    </div>
  );
}
