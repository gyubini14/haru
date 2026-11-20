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
      lines.push(`- ${stop.time}: ${stop.place.name}, ${stop.place.area}${travel}`);
    }
  } else if (response.places.length > 0) {
    lines.push("Places:");
    for (const place of response.places) {
      lines.push(`- ${place.name}, ${place.area}`);
    }
  }

  return lines.join("\n");
}
