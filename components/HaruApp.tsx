"use client";

// 채팅과 지도가 같은 대화 상태를 보게 하는 화면 전체 틀 (작업 13)
// 작은 화면: 위에 지도, 아래에 채팅 / 넓은 화면: 왼쪽 채팅, 오른쪽 지도

import { useMemo } from "react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { MapView } from "@/components/map/MapView";
import { useChat, type UiMessage } from "@/hooks/useChat";
import { useLocation } from "@/hooks/useLocation";
import type { Place } from "@/lib/types";

/** 지도에는 "가장 최근 Haru 답변"의 장소만 올린다. (그 답변에 장소가 없으면 마커도 없다) */
function latestMapPlaces(messages: UiMessage[]): Place[] {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "assistant") continue;
    // 하루 일정이면 일정에 들어간 장소를 (일정 번호 순서대로), 아니면 추천 장소를 올린다
    const stops = m.response?.itinerary?.stops;
    if (stops && stops.length > 0) return stops.map((s) => s.place);
    return m.response?.places ?? [];
  }
  return [];
}

export function HaruApp() {
  const location = useLocation();
  const chat = useChat(location.position);
  // 대화가 바뀔 때만 새 배열을 만든다. (매번 새 배열이면 지도 마커가 화면이 바뀔 때마다 다시 그려진다)
  const { messages } = chat;
  const latestPlaces = useMemo(() => latestMapPlaces(messages), [messages]);

  return (
    <main className="flex h-dvh flex-col lg:flex-row-reverse">
      <div className="h-44 shrink-0 border-b border-zinc-200 lg:h-auto lg:flex-1 lg:border-b-0 lg:border-l dark:border-zinc-800">
        <MapView places={latestPlaces} />
      </div>
      <div className="min-h-0 flex-1 lg:max-w-2xl lg:flex-none lg:basis-[42rem]">
        <ChatPanel {...chat} location={location} />
      </div>
    </main>
  );
}
