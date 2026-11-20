"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { responseToHistoryText } from "@/lib/chatHistory";
import { MAX_HISTORY_MESSAGES } from "@/lib/constants";
import { MESSAGES } from "@/lib/messages";
import type { ApiError, ChatMessage, ChatResponse, Position } from "@/lib/types";

export interface UiMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  /** Haru의 답변일 때만 있다 (장소 카드·일정 카드를 그리는 데 쓴다) */
  response?: ChatResponse;
}

/**
 * 화면의 대화를 서버로 보낼 모양으로 바꾼다. 최근 10턴(말풍선 최대 20개)만 보낸다.
 * Haru의 이전 답변은 장소 목록도 글로 함께 보내서 "두 번째 곳 더 알려줘" 같은 질문이 통하게 한다.
 */
function toApiMessages(messages: UiMessage[]): ChatMessage[] {
  return messages.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
    role: m.role,
    content: m.response ? responseToHistoryText(m.response) : m.content,
  }));
}

/** 서버(/api/chat)에 대화를 보내 Haru의 답변을 받는다. 실패하면 영어 오류 문구를 담아 던진다. */
async function askServer(
  conversation: UiMessage[],
  location: Position | null,
): Promise<ChatResponse> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // 위치는 "내 위치 사용"을 켠 경우에만 보낸다 (이미 약 1km로 줄인 좌표)
    body: JSON.stringify({
      messages: toApiMessages(conversation),
      ...(location ? { location } : {}),
    }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiError | null;
    throw new Error(body?.error?.message ?? MESSAGES.aiFailure);
  }
  return (await res.json()) as ChatResponse;
}

export function useChat(location: Position | null = null) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextId = useRef(1);
  const history = useRef<UiMessage[]>([]);
  // 질문을 보내는 순간의 최신 위치를 쓰기 위해 ref에 둔다
  const locationRef = useRef<Position | null>(location);
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  const request = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await askServer(history.current, locationRef.current);
      const reply: UiMessage = {
        id: nextId.current++,
        role: "assistant",
        content: data.reply,
        response: data,
      };
      history.current = [...history.current, reply];
      setMessages(history.current);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : MESSAGES.aiFailure);
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
      await request();
    },
    [loading, request],
  );

  /** 오류가 났을 때 마지막 질문을 다시 보낸다. (대화의 마지막이 사용자 질문일 때만) */
  const retry = useCallback(async () => {
    if (loading) return;
    const last = history.current[history.current.length - 1];
    if (last?.role === "user") await request();
  }, [loading, request]);

  return { messages, loading, error, send, retry };
}
