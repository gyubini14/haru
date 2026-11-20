// 답변 글(reply)을 읽기 쉽게 정리한다. (가독성 개선)
// - 빈 줄(엔터)을 없애 답변이 길어지지 않게 한다.
// - 장소 카드가 따로 나오는 답변은 카드와 같은 내용을 반복하는 목록을 빼고 소개 문장만 남긴다.
// - 글 속의 "(site.com)" 같은 괄호 출처는 지운다. (출처는 장소 카드에 링크로 따로 보여 준다)

/** 괄호 안에 사이트 주소만 있는 출처 표기. 예: (inmykorea.com), (koreabycar.com/journal) */
const SITE_CITATION = /\s*\((?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^)\s]*)?\)/gi;

/** 빈 줄을 모두 없애고 줄 앞뒤 공백, 이탤릭 지역 줄(_Seoul_), 기호만 있는 줄을 정리한다. */
export function compactReply(text: string): string {
  return text
    .replace(SITE_CITATION, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/^_[^_]+_$/.test(line)) // "_Seoul, South Korea_" 같은 지역 줄은 카드에 있으므로 뺀다
    .filter((line) => !/^[-•*]+$/.test(line))
    .join("\n");
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9가-힣]+/g, "");
}

/**
 * 장소 카드가 있는 답변에서 목록 부분을 잘라 내고 소개 문장만 남긴다.
 * 목록의 시작: "1." 같은 번호 줄, "- " 줄, 또는 장소 이름으로 시작하는 줄.
 * 소개가 없으면(목록으로 바로 시작) fallback을 쓴다.
 */
export function introOnly(text: string, placeNames: string[], fallback: string): string {
  const lines = compactReply(text).split("\n").filter(Boolean);
  const names = placeNames.map(normalize).filter((n) => n.length >= 4);

  const cut = lines.findIndex((line) => {
    if (/^\d+[.)]\s/.test(line) || /^[-•]\s/.test(line)) return true;
    const n = normalize(line);
    return names.some((name) => n === name || n.startsWith(name));
  });

  let intro = (cut === -1 ? lines : lines.slice(0, cut)).join(" ").trim();
  if (cut === 0 || !intro) return fallback;

  // 목록이 따로 없는 긴 글이면 앞부분 두 문장 정도만 남긴다
  if (cut === -1 && intro.length > 320) {
    const sentences = intro.match(/[^.!?]+[.!?]+/g) ?? [intro];
    intro = sentences.slice(0, 2).join(" ").trim();
  }
  return intro;
}
