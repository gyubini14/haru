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
  location,
}: ReturnType<typeof useChat> & { location: LocationControl }) {

  return (
    <section className="mx-auto flex h-full w-full max-w-2xl flex-col">
      <header className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h1 className="text-xl font-bold">Haru</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Let your day shine, even in a new Korea
        </p>
      </header>

      <p className="bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:bg-zinc-900 dark:text-amber-300">
        ⓘ {MESSAGES.privacyNotice}
      </p>

      <LocationBar {...location} />

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <WelcomeChips onPick={send} />
        ) : (
          <MessageList messages={messages} loading={loading} error={error} onRetry={retry} />
        )}
      </div>

      <div className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <ChatInput disabled={loading} onSend={send} />
      </div>
    </section>
  );
}
