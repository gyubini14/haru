import type { UiMessage } from "@/hooks/useChat";
import { ItineraryCard } from "@/components/chat/ItineraryCard";
import { PlaceCard } from "@/components/chat/PlaceCard";

export function MessageBubble({ message }: { message: UiMessage }) {
  const isUser = message.role === "user";
  const response = message.response;
  const stops = response?.itinerary?.stops ?? [];

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] space-y-3 ${isUser ? "" : "w-full max-w-[92%]"}`}>
        {/* 답변은 글자로만 표시한다 (HTML로 해석하지 않음) */}
        <div
          className={`whitespace-pre-wrap rounded-3xl px-5 py-3 text-base leading-relaxed ${
            isUser ? "bg-ink text-paper" : "bg-soft text-ink"
          }`}
        >
          {message.content}
        </div>
        {stops.length > 0 ? (
          <ItineraryCard stops={stops} />
        ) : (
          response?.places.map((place, i) => (
            <PlaceCard key={`${place.name}-${i}`} place={place} index={i} />
          ))
        )}
      </div>
    </div>
  );
}
