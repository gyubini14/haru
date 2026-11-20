// .env에 앱이 쓰는 키가 들어 있는지 확인한다. (PLAN.md 작업 1)
// 값은 절대 출력하지 않고 "값 있음 / 값 없음"만 보여 준다.
// 실행: npm run check:env

const KEYS = [
  { name: "OPENAI_API_KEY", use: "AI 답변과 웹 검색 (서버)" },
  { name: "GOOGLE_PLACES_API_KEY", use: "장소 이름 → 좌표 변환 (서버)" },
  { name: "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", use: "지도 화면 표시 (브라우저)" },
];

let missing = 0;
for (const { name, use } of KEYS) {
  const hasValue = (process.env[name] ?? "").trim().length > 0;
  if (!hasValue) missing += 1;
  console.log(`${hasValue ? "✅ 값 있음" : "❌ 값 없음"}  ${name}  - ${use}`);
}

if (missing > 0) {
  console.log(`\n${missing}개가 비어 있습니다. .env 파일에 값을 넣어 주세요.`);
  process.exit(1);
}
console.log("\n모든 키가 준비되어 있습니다.");
