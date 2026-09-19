"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StoredImage } from "@/components/ui/StoredImage";

export function ActivityGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
  }, [images]);

  if (images.length === 0) return null;

  const select = (index: number) => {
    setActive((index + images.length) % images.length);
  };

  return (
    <section aria-label={`Galeri ${title}`} className="space-y-3">
      <div className="group relative overflow-hidden rounded-2xl bg-slate-100">
        <StoredImage
          src={images[active]}
          alt={`${title} — foto ${active + 1} dari ${images.length}`}
          className="aspect-[16/9] max-h-[34rem] w-full object-contain"
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => select(active - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow-md transition hover:bg-white"
              aria-label="Foto sebelumnya"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => select(active + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow-md transition hover:bg-white"
              aria-label="Foto berikutnya"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-slate-950/70 px-2.5 py-1 text-xs font-medium text-white">
              {active + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={`shrink-0 overflow-hidden rounded-lg border-2 transition ${
                index === active ? "border-gold" : "border-transparent opacity-70 hover:opacity-100"
              }`}
              aria-label={`Tampilkan foto ${index + 1}`}
              aria-current={index === active}
            >
              <StoredImage
                src={image}
                alt=""
                className="h-16 w-24 object-cover sm:h-20 sm:w-28"
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
