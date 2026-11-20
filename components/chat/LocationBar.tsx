"use client";

import type { LocationControl } from "@/hooks/useLocation";
import { MESSAGES } from "@/lib/messages";

// "내 위치 사용" 켜기/끄기 버튼과 안내 문구 (PRD 6·7번)
export function LocationBar({ status, toggle }: LocationControl) {
  const active = status === "on" || status === "getting";

  return (
    <div className="space-y-1.5 border-b border-line px-4 pb-2 text-xs sm:px-5 lg:pb-3">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={active}
        className={`inline-flex min-h-11 items-center rounded-full border px-4 font-medium transition-colors lg:min-h-0 lg:py-1.5 ${
          active
            ? "border-ink bg-ink text-paper"
            : "border-line text-ink hover:border-ink"
        }`}
      >
        {status === "getting"
          ? MESSAGES.gettingLocation
          : active
            ? MESSAGES.stopUsingLocation
            : MESSAGES.useMyLocation}
      </button>
      {status === "on" && <p className="text-mute">{MESSAGES.locationNotice}</p>}
      {status === "denied" && <p className="text-warn">{MESSAGES.locationDenied}</p>}
      {status === "outside" && <p className="text-warn">{MESSAGES.locationOutsideKorea}</p>}
    </div>
  );
}
