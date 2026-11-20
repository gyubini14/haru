// Google 장소 검색(Places API) 키가 동작하는지 확인한다. (작업 12)
// 좌표와 상태 코드만 출력하고 키 값은 출력하지 않는다. 실행: node scripts/check-places.mjs

process.loadEnvFile(".env");
const key = process.env.GOOGLE_PLACES_API_KEY;
if (!key) {
  console.log("❌ GOOGLE_PLACES_API_KEY 값 없음");
  process.exit(1);
}

for (const q of ["Gamcheon Culture Village, Saha-gu, South Korea", "Hantan River Sky Bridge, Pocheon, South Korea"]) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "places.location",
    },
    body: JSON.stringify({ textQuery: q, regionCode: "KR", languageCode: "en", maxResultCount: 1 }),
  });
  const body = await res.json().catch(() => ({}));
  // 오류일 때도 키가 들어갈 수 있는 전체 본문은 출력하지 않고 오류 상태 이름만 보여 준다
  console.log(res.status, JSON.stringify(body.places?.[0]?.location ?? body.error?.status ?? null), "-", q);
}
