// 작업 16: 하루 일정 질문 10개와 부분 수정 3개를 /api/chat에 보내 결과를 ITINERARY-RESULTS.md/json으로 저장한다.
// 사용: node scripts/run-itinerary-tests.mjs [서버주소]   (개발 서버가 켜져 있어야 한다)
// 자동으로 확인하는 것: 장소 3~5곳, 시간대·이동 방법·시간 포함, 이동 30분 이내, 좌표 확보, 수정 시 나머지 장소 유지
// 사람이 판정하는 것: 장소가 실제로 있는지, 지도 위치가 맞는지(구글 지도 링크로 확인)

import { writeFileSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3000";
const GAP_MS = 8000;

const PLANS = [
  "Plan a one-day itinerary in Seoul around Gyeongbokgung and Bukchon for me.",
  "Can you plan a day in Hongdae and Yeonnam-dong, Seoul? I like cafes and shopping.",
  "Plan one day in Myeongdong and Namsan, Seoul.",
  "Please plan a full day in Busan, including some seafood and a beach.",
  "Plan a day trip in Jeju City for a first-time visitor.",
  "I want a one-day plan in Jeonju Hanok Village with local food.",
  "Plan a day in Gyeongju to see the historical sites.",
  "Make me a day plan around Gangnam and Jamsil, Seoul.",
  "Plan a relaxing day in Incheon, including Chinatown.",
  "Plan a day in Seoul for K-drama fans, around Itaewon and Hannam-dong.",
];

// 처음 3개 일정에 대한 부분 수정 요청 (나머지 장소가 유지되는지 확인)
const EDITS = [
  "Change the lunch to Korean food.",
  "Replace the last stop with something indoors.",
  "Add a coffee break at a cafe in the afternoon.",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function post(messages) {
  const started = Date.now();
  let status = 0;
  let body = null;
  try {
    const res = await fetch(`${BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    status = res.status;
    body = await res.json();
  } catch (e) {
    body = { error: String(e?.name ?? e) };
  }
  return { status, body, seconds: Math.round((Date.now() - started) / 100) / 10 };
}

// 일정을 다음 요청에 보낼 글로 바꾼다 (화면의 chatHistory와 같은 모양)
function historyText(b) {
  const lines = [b.reply, "Itinerary:"];
  for (const s of b.itinerary?.stops ?? []) {
    const travel = s.travelToNext ? ` (then ${s.travelToNext.minutes} min by ${s.travelToNext.mode})` : "";
    lines.push(`- ${s.time}: ${s.place.name}, ${s.place.area}${travel} [source: ${s.place.sourceUrl}]`);
  }
  return lines.join("\n");
}

// 자동 점검: 일정이 PRD N1 기준을 지키는지
function check(b) {
  const stops = b?.itinerary?.stops ?? [];
  const problems = [];
  if (b?.kind !== "itinerary") problems.push("일정이 아님(" + b?.kind + ")");
  if (stops.length < 3 || stops.length > 5) problems.push(`장소 ${stops.length}곳 (3~5곳이어야 함)`);
  stops.forEach((s, i) => {
    if (!s.time) problems.push(`${i + 1}번 시간대 없음`);
    const last = i === stops.length - 1;
    if (!last && !s.travelToNext) problems.push(`${i + 1}번 이동 정보 없음`);
    if (s.travelToNext && s.travelToNext.minutes > 30) problems.push(`${i + 1}번 이동 ${s.travelToNext.minutes}분 (30분 초과)`);
    if (!s.place.position) problems.push(`${i + 1}번 좌표 없음`);
  });
  return problems;
}

const results = [];

for (let i = 0; i < PLANS.length; i++) {
  const q = PLANS[i];
  const r = await post([{ role: "user", content: q }]);
  const problems = check(r.body);
  results.push({ id: `P${i + 1}`, question: q, ...r, problems });
  console.log(`P${i + 1} ${r.status} ${r.seconds}s ${problems.length ? "문제 " + problems.join("; ") : "OK"}`);
  await sleep(GAP_MS);

  // 앞 3개 일정은 부분 수정도 시험한다
  if (i < EDITS.length && r.body?.itinerary) {
    const edit = EDITS[i];
    const r2 = await post([
      { role: "user", content: q },
      { role: "assistant", content: historyText(r.body) },
      { role: "user", content: edit },
    ]);
    const before = r.body.itinerary.stops.map((s) => s.place.name);
    const after = (r2.body?.itinerary?.stops ?? []).map((s) => s.place.name);
    const kept = before.filter((n) => after.includes(n)).length;
    const problems2 = check(r2.body);
    results.push({ id: `E${i + 1}`, question: `${q}  →  ${edit}`, ...r2, problems: problems2, kept, beforeCount: before.length });
    console.log(`E${i + 1} ${r2.status} ${r2.seconds}s 유지 ${kept}/${before.length} ${problems2.length ? "문제 " + problems2.join("; ") : "OK"}`);
    await sleep(GAP_MS);
  }
}

writeFileSync("ITINERARY-RESULTS.json", JSON.stringify(results, null, 2), "utf8");

// 요약
const plans = results.filter((r) => r.id.startsWith("P"));
const okPlans = plans.filter((r) => r.problems.length === 0);
const allStops = results.flatMap((r) => r.body?.itinerary?.stops ?? []);
const withPos = allStops.filter((s) => s.place.position).length;
let md = "# 작업 16 점검 결과 (판정 전)\n\n";
md += `## 자동 점검 요약\n\n- 일정 질문 ${plans.length}개 중 기준을 모두 지킨 일정: **${okPlans.length}개** (${Math.round((okPlans.length / plans.length) * 100)}%, 목표 80%)\n`;
md += `- 좌표가 있는 장소: ${withPos}/${allStops.length}\n`;
md += `- 응답 시간: ${results.map((r) => r.seconds).join(", ")}초\n\n`;
md += "## 판정 방법\n\n각 장소 옆의 **지도 링크**를 눌러 구글 지도의 표시 위치가 그 장소가 맞는지 확인하고, 틀린 것만 알려 주세요. 장소가 실제로 있는지도 함께 봐 주세요.\n\n";
for (const r of results) {
  const b = r.body ?? {};
  md += `## ${r.id}. ${r.question}\n\n- 상태 ${r.status}, 응답 ${r.seconds}초, 종류 ${b.kind ?? "(오류)"}\n`;
  md += `- 자동 점검: ${r.problems.length ? r.problems.join("; ") : "통과"}${r.kept !== undefined ? ` / 수정 후 기존 장소 유지 ${r.kept}/${r.beforeCount}` : ""}\n`;
  md += `- 소개: ${b.reply ?? JSON.stringify(b)}\n\n`;
  (b.itinerary?.stops ?? []).forEach((s, i) => {
    const p = s.place;
    const map = p.position ? `[지도](https://www.google.com/maps?q=${p.position.lat},${p.position.lng})` : "좌표 없음";
    md += `  ${i + 1}. ${s.time} — **${p.name}** (${p.area}) ${map}\n`;
    md += `     - ${p.reason}\n     - 가는 방법: ${p.howToGetThere}\n`;
    if (s.travelToNext) md += `     - 다음 장소까지: ${s.travelToNext.minutes}분, ${s.travelToNext.mode}\n`;
    md += `     - 출처: ${p.sourceUrl}\n`;
  });
  md += "\n";
}
writeFileSync("ITINERARY-RESULTS.md", md, "utf8");
console.log(`\n일정 기준 통과 ${okPlans.length}/${plans.length}, 좌표 ${withPos}/${allStops.length}`);
console.log("저장 완료: ITINERARY-RESULTS.md, ITINERARY-RESULTS.json");
