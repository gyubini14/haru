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
    <div className="rounded-xl border border-amber-200 bg-white p-3 text-sm dark:border-amber-900 dark:bg-zinc-900">
      <div className="flex items-start gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-zinc-900">
          {index + 1}
        </span>
        <div className="min-w-0">
          <p className="font-semibold">{place.name}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{place.area}</p>
        </div>
      </div>
      {place.source && (
        <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400">
          Filming location: {place.source}
        </p>
      )}
      <p className="mt-2">{place.reason}</p>
      <p className="mt-1 text-zinc-600 dark:text-zinc-300">{place.howToGetThere}</p>
      {place.tip && <p className="mt-1 text-zinc-600 dark:text-zinc-300">Tip: {place.tip}</p>}
      {place.source && (
        <p className="mt-1 text-zinc-600 dark:text-zinc-300">{MESSAGES.filmingEtiquette}</p>
      )}
      {place.bookingTips && (
        <p className="mt-1 text-zinc-600 dark:text-zinc-300">Booking tip: {place.bookingTips}</p>
      )}
      {place.fromKoreanSource && (
        <p className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Based on a Korean source
        </p>
      )}
      {place.sourceUrl ? (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Source:{" "}
          <a
            href={place.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {siteName(place.sourceUrl)}
          </a>
          . {MESSAGES.checkSource}
        </p>
      ) : (
        !place.verified && (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
            Please verify the details before you go.
          </p>
        )
      )}
      {place.mapNote && (
        <p className="mt-2 text-xs text-zinc-500">
          Couldn&apos;t place this on the map: {place.mapNote}
        </p>
      )}
    </div>
  );
}
