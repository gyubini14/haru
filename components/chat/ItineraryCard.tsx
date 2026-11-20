import { PlacePhoto } from "@/components/chat/PlacePhoto";
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

// 하루 일정 카드 (PRD N1). 번호는 지도 마커 번호와 같다. 번호·시간·이름은 하얀 블록, 나머지는 짧게.
export function ItineraryCard({ stops }: { stops: ItineraryStop[] }) {
  if (stops.length === 0) return null;
  // 이동이 30분을 넘는 구간이 있으면 일정 맨 위에서 먼저 알린다 (각 구간에도 표시)
  const hasLongTrip = stops.some((s) => (s.travelToNext?.minutes ?? 0) > MAX_TRANSIT_MINUTES);
  return (
    <ol className="space-y-2 rounded-2xl bg-soft p-3 text-sm leading-snug">
      {hasLongTrip && (
        <li className="rounded-xl bg-white px-3 py-2 text-xs text-amber-800">
          Note: some trips in this plan take longer than 30 minutes by public transit.
        </li>
      )}
      {stops.map((stop, i) => (
        <li key={`${stop.time}-${stop.place.name}-${i}`} className="space-y-1.5">
          <PlacePhoto photo={stop.place.photo} name={stop.place.name} />
          <div className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2 text-zinc-900">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-base font-semibold tracking-tight">
                {stop.place.name}
                {stop.place.nameKo && (
                  <span className="ml-2 text-sm font-normal text-zinc-500">{stop.place.nameKo}</span>
                )}
              </p>
              <p className="text-xs text-zinc-500">
                {stop.time} · {stop.place.area}
              </p>
            </div>
          </div>
          <div className="space-y-0.5 px-1">
            <p>{stop.place.reason}</p>
            <p className="text-mute">{stop.place.howToGetThere}</p>
            {stop.place.sourceUrl && (
              <p className="pt-0.5 text-xs text-mute">
                Source:{" "}
                <a
                  href={stop.place.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink underline underline-offset-2"
                >
                  {siteName(stop.place.sourceUrl)}
                </a>
                . {MESSAGES.checkSource}
              </p>
            )}
            {stop.place.mapNote && (
              <p className="text-xs text-mute">
                Couldn&apos;t place this on the map: {stop.place.mapNote}
              </p>
            )}
          </div>
          {stop.travelToNext && (
            <p className="px-1 pt-1 text-xs font-medium text-mute">
              ↓ {stop.travelToNext.minutes} min by {stop.travelToNext.mode}
              {stop.travelToNext.minutes > MAX_TRANSIT_MINUTES &&
                " (longer than 30 minutes, please check the route)"}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
