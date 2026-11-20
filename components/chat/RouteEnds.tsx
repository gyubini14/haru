import type { RouteEnds as RouteEndsData } from "@/lib/types";

// 교통 질문의 출발지(A)·도착지(B). 지도의 A, B 마커와 같은 글자를 쓴다. 이동 경로선은 그리지 않는다.
export function RouteEnds({ route }: { route: RouteEndsData }) {
  const ends = [
    { label: "A", caption: "From", end: route.from },
    { label: "B", caption: "To", end: route.to },
  ];
  return (
    <div className="space-y-2 rounded-2xl bg-soft p-3 text-sm leading-snug">
      {ends.map(({ label, caption, end }) => (
        <div key={label}>
          <div className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2 text-zinc-900">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
              {label}
            </span>
            <div className="min-w-0">
              <p className="text-base font-semibold tracking-tight">
                {end.name}
                {end.nameKo && (
                  <span className="ml-2 text-sm font-normal text-zinc-500">{end.nameKo}</span>
                )}
              </p>
              <p className="text-xs text-zinc-500">
                {caption} · {end.area}
              </p>
            </div>
          </div>
          {!end.position && (
            <p className="px-1 pt-1 text-xs text-mute">
              Couldn&apos;t place this on the map: its exact location could not be confirmed.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
