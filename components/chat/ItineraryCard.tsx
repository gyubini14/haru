import type { ItineraryStop } from "@/lib/types";

export function ItineraryCard({ stops }: { stops: ItineraryStop[] }) {
  if (stops.length === 0) return null;
  return (
    <ol className="space-y-2 rounded-xl border border-amber-200 bg-white p-3 text-sm dark:border-amber-900 dark:bg-zinc-900">
      {stops.map((stop, i) => (
        <li key={`${stop.time}-${stop.place.name}`}>
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
            {i + 1}. {stop.time}
          </p>
          <p className="font-semibold">{stop.place.name}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{stop.place.area}</p>
          {stop.travelToNext && (
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
              ↓ {stop.travelToNext.minutes} min by {stop.travelToNext.mode}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
