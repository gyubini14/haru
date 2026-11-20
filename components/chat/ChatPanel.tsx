"use client";

import Link from "next/link";
import { ChatInput } from "@/components/chat/ChatInput";
import { LocationBar } from "@/components/chat/LocationBar";
import { MessageList } from "@/components/chat/MessageList";
import { WelcomeChips } from "@/components/chat/WelcomeChips";
import type { useChat } from "@/hooks/useChat";
import type { LocationControl } from "@/hooks/useLocation";
import { MESSAGES } from "@/lib/messages";

// 대화 상태는 위(HaruApp)에서 만들어 받는다. 지도도 같은 상태를 쓰기 때문이다.
export function ChatPanel({
  messages,
  loading,
  error,
  send,
  retry,
  reset,
  location,
  mapOpen,
  onToggleMap,
}: ReturnType<typeof useChat> & {
  location: LocationControl;
  /** 작은 화면에서 지도가 펼쳐져 있는지 */
  mapOpen: boolean;
  onToggleMap: () => void;
}) {
  const pill =
    "inline-flex min-h-11 shrink-0 items-center rounded-full border border-line px-4 text-xs font-medium transition-colors hover:border-ink";
  return (
    <section className="mx-auto flex h-full w-full max-w-2xl flex-col bg-paper">
      <header className="flex items-center justify-between gap-3 px-4 pb-1 pt-2 sm:px-5 lg:items-start lg:pb-3 lg:pt-5">
        <div>
          {/* 글자 사이를 넓힌 로고체 (STAYFOLIO 같은 느낌). 누르면 메인페이지로 간다 */}
          <h1 className="text-lg font-semibold uppercase tracking-[0.5em]">
            <Link href="/">Haru</Link>
          </h1>
          {/* 작은 화면에서는 자리를 아끼려고 숨긴다 (메인페이지에 있다) */}
          <p className="mt-1 hidden text-xs text-mute lg:block">
            Let your day shine, even in a new Korea
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* 작은 화면에서만: 지도 접기·펼치기 */}
          <button
            type="button"
            onClick={onToggleMap}
            aria-pressed={mapOpen}
            className={`${pill} lg:hidden`}
          >
            {mapOpen ? "Hide map" : "Map"}
          </button>
          {/* 대화가 시작된 뒤에만 보인다. 누르면 새로고침 없이 처음 화면으로 돌아간다 */}
          {messages.length > 0 && (
            <button type="button" onClick={reset} className={pill}>
              New chat
            </button>
          )}
        </div>
      </header>

      <p className="px-4 pb-1.5 text-[11px] leading-snug text-mute sm:px-5 sm:text-xs lg:pb-2">
        ⓘ {MESSAGES.privacyNotice}
      </p>

      <LocationBar {...location} />

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
        {messages.length === 0 ? (
          <WelcomeChips onPick={send} />
        ) : (
          <MessageList messages={messages} loading={loading} error={error} onRetry={retry} />
        )}
      </div>

      {/* 아래 여백은 휴대폰의 홈 막대 영역을 피한다 */}
      <div className="border-t border-line px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 sm:pt-4">
        <ChatInput disabled={loading} onSend={send} />
      </div>
    </section>
  );
}
