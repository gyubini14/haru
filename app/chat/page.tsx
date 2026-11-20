import type { Metadata } from "next";
import { HaruApp } from "@/components/HaruApp";

export const metadata: Metadata = {
  title: "Chat — Haru",
};

// 채팅 화면. (메인페이지의 예시 질문으로 들어오면 /chat?q=질문 — 질문은 브라우저에서 읽어 바로 보낸다)
export default function ChatPage() {
  return <HaruApp />;
}
