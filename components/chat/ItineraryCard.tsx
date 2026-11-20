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

// 하루 일정 카드 (PRD N1). 번호는 지도 마커 번호와 같다.
export function ItineraryCard({ stops }: { stops: ItineraryStop[] }) {
  if (stops.length === 0) return null;
  // 이동이 30분을 넘는 구간이 있으면 일정 맨 위에서 먼저 알린다 (각 구간에도 표시)
  const hasLongTrip = stops.some((s) => (s.travelToNext?.minutes ?? 0) > MAX_TRANSIT_MINUTES);
  return (
    <ol className="space-y-5 rounded-2xl border border-line bg-paper p-4 text-sm leading-relaxed">
      {hasLongTrip && (
        <li className="rounded-xl bg-soft px-3 py-2 text-xs text-warn">
          Note: some trips in this plan take longer than 30 minutes by public transit.
        </li>
      )}
      {stops.map((stop, i) => (
        <li key={`${stop.time}-${stop.place.name}-${i}`} className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-paper">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-mute">{stop.time}</p>
            <p className="text-base font-semibold tracking-tight">
              {stop.place.name}
              {stop.place.nameKo && (
                <span className="ml-2 text-sm font-normal text-mute">{stop.place.nameKo}</span>
              )}
            </p>
            <p className="text-xs text-mute">{stop.place.area}</p>
            <div className="mt-2">
              <PlacePhoto photo={stop.place.photo} name={stop.place.name} />
            </div>
            <p className="mt-2">{stop.place.reason}</p>
            <p className="mt-1 text-mute">{stop.place.howToGetThere}</p>
            {stop.place.sourceUrl && (
              <p className="mt-2 text-xs text-mute">
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
              <p className="mt-2 text-xs text-mute">
                Couldn&apos;t place this on the map: {stop.place.mapNote}
              </p>
            )}
            {stop.travelToNext && (
              <p className="mt-3 border-l border-line pl-3 text-xs font-medium text-mute">
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
