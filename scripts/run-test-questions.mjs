// 작업 10: 테스트 질문 20개를 /api/chat에 보내 결과를 TEST-RESULTS.md와 JSON으로 저장한다.
// 사용: node scripts/run-test-questions.mjs [서버주소]   (개발 서버가 켜져 있어야 한다)
// 분당 10회 제한이 있어 질문 사이에 간격을 둔다.

import { writeFileSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3000";
const GAP_MS = 7000;

const QUESTIONS = [
  // 맛집 4
  ["food", "Where can I find good local food near Hongdae?"],
  ["food", "I want to try authentic Korean BBQ in Seoul that locals actually go to. Any recommendations?"],
  ["food", "Where can I eat vegetarian-friendly Korean food in Itaewon?"],
  ["food", "What are some good street food spots in Busan?"],
  // 숙소 4 (지역·예산·인원을 한 번에 제공)
  ["stay", "I need a hotel in Hongdae, Seoul. Budget is about 100,000 KRW per night, 2 guests."],
  ["stay", "Looking for a guesthouse in Jeonju Hanok Village, around 80,000 KRW per night for 2 people."],
  ["stay", "Where should I stay in Busan near Haeundae? Budget 150,000 KRW per night, 3 guests."],
  ["stay", "Recommend a place to stay near Myeongdong, Seoul, about 120,000 KRW a night for 1 person."],
  // 교통 3
  ["transport", "How do I get from Incheon Airport to Myeongdong?"],
  ["transport", "How do I get from Seoul Station to Busan, and which is better, KTX or bus?"],
  ["transport", "How do I use the subway in Seoul as a tourist? Do I need a T-money card?"],
  // 사진 스팟 3
  ["photo", "Where can I take pretty photos in Busan?"],
  ["photo", "What are the best photo spots in Seoul for sunset?"],
  ["photo", "Where can I take nice photos around Jeju Island?"],
  // 촬영지 6
  ["filming", "Where was Crash Landing on You filmed?"],
  ["filming", "Where was the drama Goblin (Guardian: The Lonely and Great God) filmed?"],
  ["filming", "Where was Squid Game filmed in Korea?"],
  ["filming", "Where was the drama Itaewon Class filmed?"],
  ["filming", "Where was the BTS Spring Day music video filmed?"],
  ["filming", "Where was the drama Business Proposal filmed?"],
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const results = [];
for (let i = 0; i < QUESTIONS.length; i++) {
  const [category, question] = QUESTIONS[i];
  const started = Date.now();
  let status = 0;
  let body = null;
  try {
    const res = await fetch(`${BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: question }] }),
    });
    status = res.status;
    body = await res.json();
  } catch (e) {
    body = { error: String(e?.name ?? e) };
  }
  const seconds = Math.round((Date.now() - started) / 100) / 10;
  results.push({ n: i + 1, category, question, status, seconds, body });
  console.log(`${i + 1}/20 ${category} ${status} ${seconds}s`);
  await sleep(GAP_MS);
}

writeFileSync("TEST-RESULTS.json", JSON.stringify(results, null, 2), "utf8");

// 판정용 문서 만들기
let md = "# 작업 10 점검 결과 (판정 전)\n\n";
md += "각 장소를 보고 **존재함 / 위치·가는 방법 맞음 / 영어로 이해됨**을 O·X로 판정해 주세요.\n\n";
for (const r of results) {
  md += `## ${r.n}. [${r.category}] ${r.question}\n\n`;
  md += `- 상태 ${r.status}, 응답 ${r.seconds}초\n`;
  const b = r.body ?? {};
  md += `- 종류: ${b.kind ?? "(오류)"}\n`;
  md += `- 답변: ${b.reply ?? JSON.stringify(b)}\n`;
  for (const [i, p] of (b.places ?? []).entries()) {
    md += `\n  ${i + 1}. **${p.name}** (${p.area})${p.source ? ` — 촬영지: ${p.source}` : ""}\n`;
    md += `     - 이유: ${p.reason}\n`;
    md += `     - 가는 방법: ${p.howToGetThere}\n`;
    if (p.tip) md += `     - 팁: ${p.tip}\n`;
    if (p.bookingTips) md += `     - 예약 팁: ${p.bookingTips}\n`;
    md += `     - 출처: ${p.sourceUrl ?? "-"}${p.fromKoreanSource ? " (한국 사이트)" : ""}\n`;
  }
  md += "\n";
}
writeFileSync("TEST-RESULTS.md", md, "utf8");
console.log("저장 완료: TEST-RESULTS.md, TEST-RESULTS.json");
