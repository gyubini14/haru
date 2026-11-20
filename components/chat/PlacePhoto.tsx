import type { PlacePhoto as PlacePhotoData } from "@/lib/types";

// 장소 카드의 대표 사진 1장 + Google이 요구하는 촬영자 표기 (PRD M1)
// 사진이 없으면 아무것도 그리지 않는다.
export function PlacePhoto({ photo, name }: { photo: PlacePhotoData | null; name: string }) {
  if (!photo) return null;
  return (
    <figure className="mb-3 overflow-hidden rounded-xl bg-soft">
      {/* Google 사진 서버의 주소를 그대로 쓰므로 next/image의 도메인 설정 없이 일반 img를 쓴다 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.url}
        alt={name}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="h-40 w-full object-cover"
      />
      <figcaption className="px-3 py-1.5 text-[11px] text-mute">
        Photo:{" "}
        {photo.authorUrl ? (
          <a
            href={photo.authorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            {photo.authorName}
          </a>
        ) : (
          photo.authorName
        )}{" "}
        · Google Maps
      </figcaption>
    </figure>
  );
}
