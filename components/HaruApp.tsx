"use client";

// 채팅과 지도가 같은 대화 상태를 보게 하는 화면 전체 틀 (작업 13)
// 작은 화면: 위에 지도, 아래에 채팅 / 넓은 화면: 왼쪽 채팅, 오른쪽 지도

import { useMemo } from "react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { MapView } from "@/components/map/MapView";
import { useChat } from "@/hooks/useChat";
import { useLocation } from "@/hooks/useLocation";
import type { Place } from "@/lib/types";

export function HaruApp() {
  const location = useLocation();
  const chat = useChat(location.position);

  // 지도에는 "가장 최근 Haru 답변"의 장소만 올린다. (그 답변에 장소가 없으면 마커도 없다)
  const latestPlaces = useMemo<Place[]>(() => {
    for (let i = chat.messages.length - 1; i >= 0; i--) {
      const m = chat.messages[i];
      if (m.role === "assistant") return m.response?.places ?? [];
    }
    return [];
  }, [chat.messages]);

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
