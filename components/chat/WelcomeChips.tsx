import { MESSAGES } from "@/lib/messages";

// 처음 화면에 보이는 예시 질문 (누르면 바로 질문으로 보낸다)
const EXAMPLES = [
  "Where can I find good local food near Hongdae?",
  "Where was Crash Landing on You filmed?",
  "Where can I take pretty photos in Busan?",
  "How do I get from Incheon Airport to Myeongdong?",
];

export function WelcomeChips({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="space-y-6 py-6">
      <p className="text-2xl font-semibold leading-snug tracking-tight">{MESSAGES.welcome}</p>
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((text) => (
          <button
            key={text}
            type="button"
            onClick={() => onPick(text)}
            className="min-h-11 rounded-full border border-line px-4 py-2 text-left text-sm transition-colors hover:border-ink"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
