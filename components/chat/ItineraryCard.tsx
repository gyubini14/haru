import { MAX_TRANSIT_MINUTES } from "@/lib/constants";
import { MESSAGES } from "@/lib/messages";
import type { ItineraryStop } from "@/lib/types";

/** 출처 주소에서 사이트 이름(도메인)만 보여 준다 */
function siteName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}

// 하루 일정 카드 (PRD N1). 번호는 지도 마커 번호와 같다.
export function ItineraryCard({ stops }: { stops: ItineraryStop[] }) {
  if (stops.length === 0) return null;
  // 이동이 30분을 넘는 구간이 있으면 일정 맨 위에서 먼저 알린다 (각 구간에도 표시)
  const hasLongTrip = stops.some((s) => (s.travelToNext?.minutes ?? 0) > MAX_TRANSIT_MINUTES);
  return (
    <ol className="space-y-3 rounded-xl border border-amber-200 bg-white p-3 text-sm dark:border-amber-900 dark:bg-zinc-900">
      {hasLongTrip && (
        <li className="rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-900 dark:bg-zinc-800 dark:text-amber-300">
          Note: some trips in this plan take longer than 30 minutes by public transit.
        </li>
      )}
      {stops.map((stop, i) => (
        <li key={`${stop.time}-${stop.place.name}-${i}`} className="flex gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-zinc-900">
            {i + 1}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">{stop.time}</p>
            <p className="font-semibold">
              {stop.place.name}
              {stop.place.nameKo && (
                <span className="ml-1.5 font-normal text-zinc-600 dark:text-zinc-300">{stop.place.nameKo}</span>
              )}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{stop.place.area}</p>
            <p className="mt-1">{stop.place.reason}</p>
            <p className="mt-1 text-zinc-600 dark:text-zinc-300">{stop.place.howToGetThere}</p>
            {stop.place.sourceUrl && (
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Source:{" "}
                <a
                  href={stop.place.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {siteName(stop.place.sourceUrl)}
                </a>
                . {MESSAGES.checkSource}
              </p>
            )}
            {stop.place.mapNote && (
              <p className="mt-1 text-xs text-zinc-500">
                Couldn&apos;t place this on the map: {stop.place.mapNote}
              </p>
            )}
            {stop.travelToNext && (
              <p className="mt-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                ↓ {stop.travelToNext.minutes} min by {stop.travelToNext.mode}
                {stop.travelToNext.minutes > MAX_TRANSIT_MINUTES &&
                  " (longer than 30 minutes, please check the route)"}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
