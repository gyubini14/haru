"use client";

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
}: ReturnType<typeof useChat> & { location: LocationControl }) {
  return (
    <section className="mx-auto flex h-full w-full max-w-2xl flex-col bg-paper">
      <header className="flex items-start justify-between gap-3 px-5 pb-3 pt-5">
        <div>
          {/* 글자 사이를 넓힌 로고체 (STAYFOLIO 같은 느낌) */}
          <h1 className="text-lg font-semibold uppercase tracking-[0.5em]">Haru</h1>
          <p className="mt-1 text-xs text-mute">Let your day shine, even in a new Korea</p>
        </div>
        {/* 대화가 시작된 뒤에만 보인다. 누르면 새로고침 없이 처음 화면으로 돌아간다 */}
        {messages.length > 0 && (
          <button
            type="button"
            onClick={reset}
            className="shrink-0 rounded-full border border-line px-4 py-1.5 text-xs font-medium transition-colors hover:border-ink"
          >
            New chat
          </button>
        )}
      </header>

      <p className="px-5 pb-2 text-xs text-mute">ⓘ {MESSAGES.privacyNotice}</p>

      <LocationBar {...location} />

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {messages.length === 0 ? (
          <WelcomeChips onPick={send} />
        ) : (
          <MessageList messages={messages} loading={loading} error={error} onRetry={retry} />
        )}
      </div>

      <div className="border-t border-line px-5 py-4">
        <ChatInput disabled={loading} onSend={send} />
      </div>
    </section>
  );
}
