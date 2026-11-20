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
          className="w-full resize-none rounded-3xl border border-line bg-paper px-5 py-3 text-base text-ink outline-none placeholder:text-mute focus:border-ink"
        />
        <p className="mt-1 pr-3 text-right text-xs text-mute">
          {text.length}/{MAX_MESSAGE_LENGTH}
        </p>
      </div>
      <button
        type="submit"
        disabled={!canSend}
        aria-label="Send"
        className="mb-6 h-11 rounded-full bg-ink px-6 text-sm font-medium text-paper transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
      >
        Send
      </button>
    </form>
  );
}
