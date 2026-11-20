"use client";

import type { LocationControl } from "@/hooks/useLocation";
import { MESSAGES } from "@/lib/messages";

// "내 위치 사용" 켜기/끄기 버튼과 안내 문구 (PRD 6·7번)
export function LocationBar({ status, toggle }: LocationControl) {
  const active = status === "on" || status === "getting";

  return (
    <div className="space-y-1 border-b border-zinc-200 px-4 py-2 text-xs dark:border-zinc-800">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={active}
        className={`rounded-full border px-3 py-1 ${
          active
            ? "border-amber-400 bg-amber-100 text-amber-900 dark:border-amber-600 dark:bg-amber-950 dark:text-amber-200"
            : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        }`}
      >
        {status === "getting"
          ? MESSAGES.gettingLocation
          : active
            ? MESSAGES.stopUsingLocation
            : MESSAGES.useMyLocation}
      </button>
      {status === "on" && (
        <p className="text-zinc-500 dark:text-zinc-400">{MESSAGES.locationNotice}</p>
      )}
      {status === "denied" && (
        <p className="text-amber-800 dark:text-amber-300">{MESSAGES.locationDenied}</p>
      )}
      {status === "outside" && (
        <p className="text-amber-800 dark:text-amber-300">{MESSAGES.locationOutsideKorea}</p>
      )}
    </div>
  );
}
