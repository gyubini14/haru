import { MESSAGES } from "@/lib/messages";
import type { Place } from "@/lib/types";

interface PlaceCardProps {
  place: Place;
  /** 카드 번호 (지도 마커 번호와 맞춘다) */
  index: number;
}

/** 출처 주소에서 사이트 이름(도메인)만 보여 준다. 예: allaboutkor.com */
function siteName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}

export function PlaceCard({ place, index }: PlaceCardProps) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-4 text-sm leading-relaxed">
      <div className="flex items-start gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-paper">
          {index + 1}
        </span>
        <div className="min-w-0">
          <p className="text-base font-semibold tracking-tight">
            {place.name}
            {place.nameKo && (
              <span className="ml-2 text-sm font-normal text-mute">{place.nameKo}</span>
            )}
          </p>
          <p className="text-xs text-mute">{place.area}</p>
        </div>
      </div>
      {place.source && (
        <p className="mt-3 text-xs font-medium uppercase tracking-wider text-mute">
          Filming location · {place.source}
        </p>
      )}
      <p className="mt-3">{place.reason}</p>
      <p className="mt-1 text-mute">{place.howToGetThere}</p>
      {place.tip && <p className="mt-1 text-mute">Tip: {place.tip}</p>}
      {place.source && <p className="mt-1 text-mute">{MESSAGES.filmingEtiquette}</p>}
      {place.bookingTips && <p className="mt-1 text-mute">Booking tip: {place.bookingTips}</p>}
      {place.fromKoreanSource && (
        <p className="mt-3 inline-block rounded-full border border-line px-3 py-0.5 text-xs">
          Based on a Korean source
        </p>
      )}
      {place.sourceUrl ? (
        <p className="mt-3 text-xs text-mute">
          Source:{" "}
          <a
            href={place.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink underline underline-offset-2"
          >
            {siteName(place.sourceUrl)}
          </a>
          . {MESSAGES.checkSource}
        </p>
      ) : (
        !place.verified && (
          <p className="mt-3 text-xs text-warn">Please verify the details before you go.</p>
        )
      )}
      {place.mapNote && (
        <p className="mt-3 text-xs text-mute">
          Couldn&apos;t place this on the map: {place.mapNote}
        </p>
      )}
    </div>
  );
}
