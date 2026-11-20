"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "@/components/chat/MessageBubble";
import type { UiMessage } from "@/hooks/useChat";

interface MessageListProps {
  messages: UiMessage[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function MessageList({ messages, loading, error, onRetry }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // 새 답변이 오면 맨 아래로 스크롤한다
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, error]);

  return (
    <div className="space-y-3">
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
      {loading && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400" role="status">
          Haru is thinking…
        </p>
      )}
      {error && (
        <div
          className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
          role="alert"
        >
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg bg-red-600 px-3 py-1 text-white"
          >
            Try again
          </button>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
