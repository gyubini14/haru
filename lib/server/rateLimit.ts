import { RATE_LIMIT_PER_MINUTE } from "@/lib/constants";

// 사용자(IP)별 최근 1분 요청 시각을 서버 메모리에만 잠시 둔다. 저장·기록하지 않는다.
// 서버가 여러 개로 나뉘면 횟수가 정확하지 않을 수 있다 (DESIGN.md 7.2, 시연 수준의 제한).
const WINDOW_MS = 60_000;
const MAX_TRACKED_KEYS = 5000;
const hits = new Map<string, number[]>();

function prune(now: number) {
  for (const [key, times] of hits) {
    const recent = times.filter((t) => t > now - WINDOW_MS);
    if (recent.length === 0) hits.delete(key);
    else hits.set(key, recent);
  }
}

/** 요청을 허용하면 true, 분당 한도를 넘었으면 false */
export function checkRateLimit(key: string, now: number = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => t > now - WINDOW_MS);
  if (recent.length >= RATE_LIMIT_PER_MINUTE) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > MAX_TRACKED_KEYS) prune(now);
  return true;
}
