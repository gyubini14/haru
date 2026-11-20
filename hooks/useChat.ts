"use client";

import { useCallback, useRef, useState } from "react";
import { MESSAGES } from "@/lib/messages";
import type { ChatResponse } from "@/lib/types";

export interface UiMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  /** Haru의 답변일 때만 있다 (장소 카드·일정 카드를 그리는 데 쓴다) */
  response?: ChatResponse;
}

// 작업 2: AI를 아직 연결하지 않았으므로 임시 답변을 돌려준다.
// 작업 3에서 이 함수를 서버(/api/chat) 호출로 바꾼다.
async function askTemporary(question: string): Promise<ChatResponse> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  // 오류 화면을 눈으로 확인하기 위한 임시 입력. 작업 3에서 함께 지운다.
  if (question.trim() === "/error") throw new Error("temporary error");
  return {
    kind: "answer",
    reply: "This is a temporary answer. Haru's AI is not connected yet.",
    places: [
      {
        name: "Sample Place",
        area: "Sample area",
        reason: "This card only shows how a recommendation will look.",
        howToGetThere: "Directions will appear here.",
        tip: null,
        source: null,
        verified: false,
        position: null,
        mapNote: null,
      },
    ],
    itinerary: null,
  };
}

export function useChat() {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextId = useRef(1);
  const history = useRef<UiMessage[]>([]);

  const request = useCallback(async (question: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await askTemporary(question);
      const reply: UiMessage = {
        id: nextId.current++,
        role: "assistant",
        content: data.reply,
        response: data,
      };
      history.current = [...history.current, reply];
      setMessages(history.current);
    } catch {
      setError(MESSAGES.aiFailure);
    } finally {
      setLoading(false);
    }
  }, []);

  /** 질문을 보낸다. 빈 글이거나 답변을 기다리는 중이면 무시한다. */
  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || loading) return;
      const question: UiMessage = { id: nextId.current++, role: "user", content };
      history.current = [...history.current, question];
      setMessages(history.current);
      await request(content);
    },
    [loading, request],
  );

  /** 오류가 났을 때 마지막 질문을 다시 보낸다. */
  const retry = useCallback(async () => {
    if (loading) return;
    const lastQuestion = [...history.current].reverse().find((m) => m.role === "user");
    if (lastQuestion) await request(lastQuestion.content);
  }, [loading, request]);

  return { messages, loading, error, send, retry };
}
