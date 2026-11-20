import type { UiMessage } from "@/hooks/useChat";
import { ItineraryCard } from "@/components/chat/ItineraryCard";
import { PlaceCard } from "@/components/chat/PlaceCard";

export function MessageBubble({ message }: { message: UiMessage }) {
  const isUser = message.role === "user";
  const response = message.response;
  const stops = response?.itinerary?.stops ?? [];

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] space-y-2 ${isUser ? "" : "w-full max-w-[90%]"}`}>
        {/* 답변은 글자로만 표시한다 (HTML로 해석하지 않음) */}
        <div
          className={`whitespace-pre-wrap rounded-2xl px-4 py-2 text-base ${
            isUser
              ? "bg-amber-400 text-zinc-900"
              : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
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
