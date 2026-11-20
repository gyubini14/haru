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
    <div className="space-y-4">
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
      {loading && (
        <p className="text-sm text-mute" role="status">
          Haru is thinking…
        </p>
      )}
      {error && (
        <div
          className="flex items-center gap-3 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger"
          role="alert"
        >
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full border border-danger px-4 py-1 font-medium"
          >
            Try again
          </button>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
