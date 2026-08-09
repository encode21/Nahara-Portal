"use client";

import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import type { EventGalleryItem } from "@/lib/types";
import { StoredImage } from "@/components/ui/StoredImage";

type Props = {
  videos: EventGalleryItem[];
  seeAllHref: string;
  onSelect?: (item: EventGalleryItem) => void;
  onSeeAll?: () => void;
  /** Max thumbnails in the strip (default 8) */
  limit?: number;
};

/** Portrait reel-style strip for uploaded gallery videos (below static teaser). */
export function GalleryVideoReels({
  videos,
  seeAllHref,
  onSelect,
  onSeeAll,
  limit = 8,
}: Props) {
  if (videos.length === 0) return null;

  const shown = videos.slice(0, limit);

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold text-slate-900">
            Video warga
          </h3>
          <p className="text-sm text-slate-600">Cuplikan singkat dari dokumentasi.</p>
        </div>
        <Link
          href={seeAllHref}
          onClick={onSeeAll}
          className="shrink-0 text-sm font-semibold text-[#9a7b2e] hover:underline"
        >
          Lihat semua video →
        </Link>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {shown.map((item) => {
          const isLocal = item.image_url.startsWith("/");
          const body = (
            <>
              {isLocal ? (
                <Image
                  src={item.image_url}
                  alt={item.caption ?? "Video"}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-[1.03]"
                  sizes="140px"
                />
              ) : (
                <StoredImage
                  src={item.image_url}
                  alt={item.caption ?? "Video"}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                />
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/15">
                <span className="rounded-full bg-black/55 p-2 text-white shadow-sm">
                  <Play className="h-4 w-4 fill-current" />
                </span>
              </span>
              {item.caption && (
                <span className="absolute inset-x-0 bottom-0 line-clamp-2 bg-gradient-to-t from-black/75 to-transparent px-2 pb-2 pt-6 text-[11px] leading-snug text-white">
                  {item.caption}
                </span>
              )}
            </>
          );

          const className =
            "group relative aspect-[9/16] w-[118px] shrink-0 overflow-hidden rounded-xl bg-slate-900 sm:w-[132px]";

          if (onSelect) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item)}
                className={`${className} text-left`}
              >
                {body}
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              href={seeAllHref}
              className={className}
            >
              {body}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
