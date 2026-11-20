import type { RouteEnds as RouteEndsData } from "@/lib/types";

// 교통 질문의 출발지(A)·도착지(B). 지도의 A, B 마커와 같은 글자를 쓴다. 이동 경로선은 그리지 않는다.
export function RouteEnds({ route }: { route: RouteEndsData }) {
  const ends = [
    { label: "A", caption: "From", end: route.from },
    { label: "B", caption: "To", end: route.to },
  ];
  return (
    <div className="space-y-2 rounded-2xl border border-line bg-paper p-4 text-sm">
      {ends.map(({ label, caption, end }) => (
        <div key={label} className="flex items-start gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-paper">
            {label}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-mute">{caption}</p>
            <p className="font-semibold tracking-tight">
              {end.name}
              {end.nameKo && <span className="ml-2 text-sm font-normal text-mute">{end.nameKo}</span>}
            </p>
            <p className="text-xs text-mute">{end.area}</p>
            {!end.position && (
              <p className="mt-1 text-xs text-mute">
                Couldn&apos;t place this on the map: its exact location could not be confirmed.
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
