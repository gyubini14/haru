// Haru 답변 글. 줄마다 따로 그리고, "1. 이름"처럼 번호로 시작하는 줄은 하얀 텍스트 블록으로 보여 한눈에 들어오게 한다.
// 서버가 빈 줄을 이미 없앤 글이므로 줄 사이 간격을 작게 둔다. (글은 HTML로 해석하지 않고 글자 그대로 표시한다)

export function ReplyText({ text }: { text: string }) {
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  return (
    <div className="space-y-1 text-[15px] leading-snug">
      {lines.map((line, i) => {
        const heading = line.match(/^(\d+)[.)]\s+(.*)$/);
        if (heading) {
          return (
            <p
              key={i}
              className="mt-2 block w-fit max-w-full rounded-lg bg-white px-3 py-1 font-semibold text-zinc-900 first:mt-0"
            >
              {heading[1]}. {heading[2]}
            </p>
          );
        }
        // "- 설명" 줄의 앞 기호는 떼고 번호 블록 아래에 붙여 보여 준다
        return <p key={i}>{line.replace(/^[-•]\s+/, "")}</p>;
      })}
    </div>
  );
}
