import Link from "next/link";
import { ChatMock } from "@/components/landing/ChatMock";

// 메인페이지: Haru가 무엇인지 소개하고 채팅(/chat)으로 안내하는 정적 화면. 서버 호출이 없다.
const REPO = "https://github.com/gyubini14/haru";

const FEATURES = [
  {
    title: "Food, stays & transport",
    text: "Local restaurants, places to stay and how to get around, with real place names and short directions.",
  },
  {
    title: "Filming locations",
    text: "Find where your favourite K-drama, film or idol video was shot, with visiting tips.",
  },
  {
    title: "Photo spots",
    text: "Scenic and photogenic places, each with a photo so you know what to expect.",
  },
  {
    title: "One-day plans",
    text: "A simple day itinerary with travel times between stops, adjustable by chat.",
  },
  {
    title: "Map & Hangul names",
    text: "Every place is pinned on the map, with its Korean name next to it to show a taxi driver.",
  },
  {
    title: "Near me (optional)",
    text: "Turn on your location to get suggestions close by. It is never stored.",
  },
];

const EXAMPLES = [
  "Where can I find good local food near Hongdae?",
  "Where was Crash Landing on You filmed?",
  "Where can I take pretty photos in Busan?",
  "How do I get from Incheon Airport to Myeongdong?",
];

const TRUST = [
  "Places come from a live web search, not from memory. Each card links to its source.",
  "Your conversation is not saved on our server.",
  "Details can change, so Haru reminds you to check before you go.",
];

const chatHref = (q?: string) => (q ? `/chat?q=${encodeURIComponent(q)}` : "/chat");

const linkClass = "underline underline-offset-2";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:py-5">
        <span className="text-lg font-semibold uppercase tracking-[0.5em]">Haru</span>
        <Link
          href={chatHref()}
          className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-medium text-paper"
        >
          Start chatting
        </Link>
      </header>

      <main className="flex-1">
        {/* 첫 화면 */}
        <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 pb-14 pt-6 sm:pt-12 lg:grid-cols-2 lg:items-center lg:gap-14 lg:pb-24">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-mute">
              Travel guide for Korea
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Let your day{" "}
              <span className="bg-[linear-gradient(transparent_62%,var(--accent)_62%)]">shine</span>
              , even in a new Korea
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-mute sm:text-lg">
              Ask in English about food, stays, transport, photo spots and K-drama filming
              locations. Haru answers with real places, photos and a map.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={chatHref()}
                className="inline-flex min-h-12 items-center rounded-full bg-ink px-7 text-base font-medium text-paper"
              >
                Start chatting
              </Link>
              <span className="text-sm text-mute">Free · No sign-up</span>
            </div>
          </div>
          <ChatMock />
        </section>

        {/* 할 수 있는 것 */}
        <section className="border-t border-line bg-soft">
          <div className="mx-auto w-full max-w-6xl px-5 py-14 lg:py-20">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">What Haru can do</h2>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <li key={f.title} className="rounded-2xl bg-white p-5 text-zinc-900">
                  <h3 className="text-base font-semibold tracking-tight">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">{f.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 예시 질문 */}
        <section className="mx-auto w-full max-w-6xl px-5 py-14 lg:py-20">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Try asking</h2>
          <p className="mt-2 text-sm text-mute">Tap a question to start a chat with it.</p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {EXAMPLES.map((q) => (
              <Link
                key={q}
                href={chatHref(q)}
                className="inline-flex min-h-11 items-center rounded-full border border-line px-5 py-2 text-left text-sm transition-colors hover:border-ink"
              >
                {q}
              </Link>
            ))}
          </div>
        </section>

        {/* 믿을 수 있는 이유 */}
        <section className="border-t border-line">
          <ul className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-12 text-sm leading-relaxed text-mute md:grid-cols-3">
            {TRUST.map((t) => (
              <li key={t} className="flex gap-3">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {t}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-mute">
          <span>Haru gives travel suggestions, not guarantees. Please check details before you go.</span>
          <nav className="flex gap-5">
            <a href={REPO} target="_blank" rel="noopener noreferrer" className={linkClass}>
              GitHub
            </a>
            <a href={`${REPO}/blob/main/PRD.md`} target="_blank" rel="noopener noreferrer" className={linkClass}>
              PRD
            </a>
            <a href={`${REPO}/blob/main/PLAN.md`} target="_blank" rel="noopener noreferrer" className={linkClass}>
              PLAN
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
