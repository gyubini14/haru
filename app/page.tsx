import { ChatPanel } from "@/components/chat/ChatPanel";
import { MapView } from "@/components/map/MapView";

// 작은 화면: 위에 지도, 아래에 채팅 / 넓은 화면: 왼쪽 채팅, 오른쪽 지도
export default function Home() {
  return (
    <main className="flex h-dvh flex-col lg:flex-row-reverse">
      <div className="h-44 shrink-0 border-b border-zinc-200 lg:h-auto lg:flex-1 lg:border-b-0 lg:border-l dark:border-zinc-800">
        <MapView />
      </div>
      <div className="min-h-0 flex-1 lg:max-w-2xl lg:flex-none lg:basis-[42rem]">
        <ChatPanel />
      </div>
    </main>
  );
}
