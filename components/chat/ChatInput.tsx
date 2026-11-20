"use client";

import { useState } from "react";
import { MAX_MESSAGE_LENGTH } from "@/lib/constants";

interface ChatInputProps {
  disabled: boolean;
  onSend: (text: string) => void;
}

export function ChatInput({ disabled, onSend }: ChatInputProps) {
  const [text, setText] = useState("");
  const canSend = !disabled && text.trim().length > 0;

  function submit() {
    if (!canSend) return;
    onSend(text);
    setText("");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-end gap-2"
    >
      <div className="flex-1">
        <textarea
          value={text}
          maxLength={MAX_MESSAGE_LENGTH}
          rows={2}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Enter로 보내고, Shift+Enter로 줄을 바꾼다
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Ask about Korea…"
          aria-label="Your message"
          className="w-full resize-none rounded-xl border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <p className="mt-1 text-right text-xs text-zinc-500">
          {text.length}/{MAX_MESSAGE_LENGTH}
        </p>
      </div>
      <button
        type="submit"
        disabled={!canSend}
        aria-label="Send"
        className="mb-5 h-10 rounded-xl bg-amber-400 px-4 font-semibold text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Send
      </button>
    </form>
  );
}
