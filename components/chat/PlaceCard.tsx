import { PlacePhoto } from "@/components/chat/PlacePhoto";
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

// 장소 카드: 번호와 이름은 하얀 블록으로, 나머지는 줄 사이를 좁혀 짧게 보여 준다.
export function PlaceCard({ place, index }: PlaceCardProps) {
  return (
    <div className="space-y-2 rounded-2xl bg-soft p-3 text-sm leading-snug">
      <PlacePhoto photo={place.photo} name={place.name} />
      <div className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2 text-zinc-900">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
          {index + 1}
        </span>
        <div className="min-w-0">
          <p className="text-base font-semibold tracking-tight">
            {place.name}
            {place.nameKo && (
              <span className="ml-2 text-sm font-normal text-zinc-500">{place.nameKo}</span>
            )}
          </p>
          <p className="text-xs text-zinc-500">{place.area}</p>
        </div>
      </div>
      <div className="space-y-0.5 px-1">
        {place.source && (
          <p className="text-[11px] font-medium uppercase tracking-wider text-mute">
            Filming location · {place.source}
          </p>
        )}
        <p>{place.reason}</p>
        <p className="text-mute">{place.howToGetThere}</p>
        {place.tip && place.tip !== place.bookingTips && (
          <p className="text-mute">Tip: {place.tip}</p>
        )}
        {place.bookingTips && <p className="text-mute">Booking tip: {place.bookingTips}</p>}
        {place.source && <p className="text-xs text-mute">{MESSAGES.filmingEtiquette}</p>}
        {place.sourceUrl ? (
          <p className="pt-1 text-xs text-mute">
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
            {place.fromKoreanSource && (
              <span className="ml-1.5 inline-block rounded-full border border-line px-2 py-px text-[11px] text-ink">
                Korean source
              </span>
            )}
          </p>
        ) : (
          !place.verified && (
            <p className="pt-1 text-xs text-warn">Please verify the details before you go.</p>
          )
        )}
        {place.mapNote && (
          <p className="text-xs text-mute">
            Couldn&apos;t place this on the map: {place.mapNote}
          </p>
        )}
      </div>
    </div>
  );
}
