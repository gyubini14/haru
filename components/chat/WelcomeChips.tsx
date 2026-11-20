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
    <div className="space-y-4 py-6">
      <p className="text-lg">{MESSAGES.welcome}</p>
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((text) => (
          <button
            key={text}
            type="button"
            onClick={() => onPick(text)}
            className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-left text-sm text-zinc-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
