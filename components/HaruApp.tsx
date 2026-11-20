"use client";

// 채팅과 지도가 같은 대화 상태를 보게 하는 화면 전체 틀 (작업 13)
// 작은 화면: 위에 지도, 아래에 채팅 / 넓은 화면: 왼쪽 채팅, 오른쪽 지도

import { useEffect, useMemo, useRef, useState } from "react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { MapView, type MapPoint } from "@/components/map/MapView";
import { useChat, type UiMessage } from "@/hooks/useChat";
import { useLocation } from "@/hooks/useLocation";
import { MAX_MESSAGE_LENGTH } from "@/lib/constants";
import type { Place } from "@/lib/types";


/**
 * 지도에는 "가장 최근 Haru 답변"의 지점만 올린다. (그 답변에 지점이 없으면 마커도 없다)
 * 하루 일정이면 일정 장소(1, 2, 3…), 교통 질문이면 출발지 A·도착지 B, 아니면 추천 장소(1, 2, 3…)다.
 * 좌표를 확인하지 못한 지점은 올리지 않는다. 번호는 카드 번호와 맞춘다.
 */
function latestMapPoints(messages: UiMessage[]): MapPoint[] {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "assistant") continue;
    const response = m.response;
    const toPoints = (places: Place[]): MapPoint[] =>
      places.flatMap((p, index) =>
        p.position
          ? [{ position: p.position, label: String(index + 1), title: p.name, nameKo: p.nameKo }]
          : [],
      );
    const stops = response?.itinerary?.stops;
    if (stops && stops.length > 0) return toPoints(stops.map((s) => s.place));
    const route = response?.route;
    if (route) {
      return [
        { end: route.from, label: "A" },
        { end: route.to, label: "B" },
      ].flatMap(({ end, label }) =>
        end.position
          ? [{ position: end.position, label, title: end.name, nameKo: end.nameKo }]
          : [],
      );
    }
    return toPoints(response?.places ?? []);
  }
  return [];
}

export function HaruApp() {
  const location = useLocation();
  const chat = useChat(location.position);
  // 대화가 바뀔 때만 새 배열을 만든다. (매번 새 배열이면 지도 마커가 화면이 바뀔 때마다 다시 그려진다)
  const { messages, send } = chat;
  const latestPoints = useMemo(() => latestMapPoints(messages), [messages]);

  // 메인페이지의 예시 질문으로 들어왔으면 한 번만 바로 보내고, 주소에서 질문을 지운다. (새로고침해도 다시 보내지 않게)
  const sentInitial = useRef(false);
  useEffect(() => {
    if (sentInitial.current) return;
    sentInitial.current = true;
    const q = new URLSearchParams(window.location.search).get("q")?.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!q) return;
    window.history.replaceState(null, "", "/chat");
    void send(q);
  }, [send]);

  // 작은 화면의 지도 접기: 처음에는 접어 두고(표시할 위치가 없으므로), 새 답변에 위치가 생기면 자동으로 펼친다.
  // 넓은 화면(lg)에서는 이 값과 상관없이 항상 보인다.
  const [mapOpen, setMapOpen] = useState(false);
  const [seenPoints, setSeenPoints] = useState(latestPoints);
  if (seenPoints !== latestPoints) {
    setSeenPoints(latestPoints);
    setMapOpen(latestPoints.length > 0);
  }

  return (
    <main className="flex h-dvh flex-col lg:flex-row-reverse">
      <div
        className={`shrink-0 overflow-hidden border-line lg:h-auto lg:flex-1 lg:border-b-0 lg:border-l ${
          mapOpen ? "h-44 border-b" : "h-0"
        }`}
      >
        <MapView points={latestPoints} />
      </div>
      <div className="min-h-0 flex-1 lg:max-w-2xl lg:flex-none lg:basis-[42rem]">
        <ChatPanel
          {...chat}
          location={location}
          mapOpen={mapOpen}
          onToggleMap={() => setMapOpen((open) => !open)}
        />
      </div>
    </main>
  );
}
