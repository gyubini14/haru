import type { UiMessage } from "@/hooks/useChat";
import { ItineraryCard } from "@/components/chat/ItineraryCard";
import { PlaceCard } from "@/components/chat/PlaceCard";
import { ReplyText } from "@/components/chat/ReplyText";
import { RouteEnds } from "@/components/chat/RouteEnds";

export function MessageBubble({ message }: { message: UiMessage }) {
  const isUser = message.role === "user";
  const response = message.response;
  const stops = response?.itinerary?.stops ?? [];

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] space-y-2 ${isUser ? "" : "w-full max-w-[92%]"}`}>
        {/* 답변은 글자로만 표시한다 (HTML로 해석하지 않음) */}
        {isUser ? (
          <div className="whitespace-pre-wrap rounded-3xl bg-ink px-5 py-3 text-base leading-relaxed text-paper">
            {message.content}
          </div>
        ) : (
          <div className="rounded-3xl bg-soft px-4 py-3 text-ink">
            <ReplyText text={message.content} />
          </div>
        )}
        {response?.route && <RouteEnds route={response.route} />}
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
