import type { ChatResponse } from "@/lib/types";

/**
 * Haru의 답변(글 + 장소 카드 + 일정)을 AI에게 다시 보낼 글로 바꾼다.
 * 서버는 대화를 저장하지 않으므로, 일정 수정 같은 이어지는 요청을 위해
 * 이전 답변의 장소와 일정을 글로 함께 보내 준다.
 */
export function responseToHistoryText(response: ChatResponse): string {
  const lines = [response.reply];

  if (response.itinerary && response.itinerary.stops.length > 0) {
    lines.push("Itinerary:");
    for (const stop of response.itinerary.stops) {
      const travel = stop.travelToNext
        ? ` (then ${stop.travelToNext.minutes} min by ${stop.travelToNext.mode})`
        : "";
      // 일정을 부분 수정할 때 바뀌지 않는 장소를 그대로 유지하도록 출처 주소도 함께 보낸다
      const source = stop.place.sourceUrl ? ` [source: ${stop.place.sourceUrl}]` : "";
      lines.push(`- ${stop.time}: ${stop.place.name}, ${stop.place.area}${travel}${source}`);
    }
  } else if (response.places.length > 0) {
    lines.push("Places:");
    for (const place of response.places) {
      lines.push(`- ${place.name}, ${place.area}`);
    }
  }

  return lines.join("\n");
}
