// 메인페이지에 보여 주는 "대화 예시" 그림. 실제 답변이 아니라 화면 모양을 보여 주는 정적 예시다.
const ROWS = [
  { n: 1, en: "Gwangjang Market", ko: "광장시장", area: "Jongno-gu, Seoul" },
  { n: 2, en: "Tongin Market", ko: "통인시장", area: "Jongno-gu, Seoul" },
];

// 지도 위 마커 위치(%)
const PINS = [
  { n: 1, x: 58, y: 38 },
  { n: 2, x: 34, y: 62 },
];

export function ChatMock() {
  return (
    <div
      role="img"
      aria-label="Example of a Haru chat: two market recommendations shown as cards and as numbered pins on a map"
      className="mx-auto w-full max-w-md rounded-3xl border border-line bg-paper p-3 shadow-sm lg:max-w-none"
    >
      <div className="relative h-36 overflow-hidden rounded-2xl bg-soft sm:h-44">
        <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px)] [background-size:28px_28px]" />
        {PINS.map((p) => (
          <span
            key={p.n}
            className="absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-zinc-900 text-xs font-semibold text-white"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            {p.n}
          </span>
        ))}
        <span className="absolute bottom-2 right-3 text-[10px] uppercase tracking-wider text-mute">
          Example
        </span>
      </div>

      <div className="mt-3 space-y-3 px-1">
        <p className="ml-auto w-fit max-w-[85%] rounded-2xl bg-ink px-4 py-2 text-sm text-paper">
          Where can I find good street food in Seoul?
        </p>
        <p className="text-sm">Here are two classic spots for local street food.</p>
        {ROWS.map((r) => (
          <div key={r.n} className="rounded-2xl bg-soft p-2.5">
            <div className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2 text-zinc-900">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                {r.n}
              </span>
              <div className="min-w-0">
                <p className="text-base font-semibold tracking-tight">
                  {r.en}
                  <span className="ml-2 text-sm font-normal text-zinc-500">{r.ko}</span>
                </p>
                <p className="text-xs text-zinc-500">{r.area}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
