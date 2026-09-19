"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { StoredImage } from "@/components/ui/StoredImage";

export function ActivityGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    setActive(0);
  }, [images]);

  useEffect(() => {
    if (!viewerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setViewerOpen(false);
      if (event.key === "ArrowLeft") setActive((current) => (current - 1 + images.length) % images.length);
      if (event.key === "ArrowRight") setActive((current) => (current + 1) % images.length);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [images.length, viewerOpen]);

  if (images.length === 0) return null;

  const select = (index: number) => {
    setActive((index + images.length) % images.length);
  };

  return (
    <section aria-label={`Galeri ${title}`} className="space-y-3">
      <div className="group relative overflow-hidden rounded-2xl bg-slate-100">
        <button
          type="button"
          onClick={() => setViewerOpen(true)}
          className="group/image block w-full cursor-zoom-in"
          aria-label={`Buka foto ${active + 1} dalam galeri layar penuh`}
        >
          <StoredImage
            src={images[active]}
            alt={`${title} — foto ${active + 1} dari ${images.length}`}
            className="aspect-[16/9] max-h-[34rem] w-full object-contain"
          />
          <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-slate-950/65 px-3 py-1.5 text-xs font-medium text-white opacity-100 shadow sm:opacity-0 sm:transition-opacity sm:group-hover/image:opacity-100">
            <Expand className="h-3.5 w-3.5" /> Perbesar
          </span>
        </button>
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

      {viewerOpen && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-slate-950/95 p-3 backdrop-blur-sm sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-label={`Galeri foto ${title}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setViewerOpen(false);
          }}
        >
          <div className="flex shrink-0 items-center justify-between gap-4 pb-3 text-white">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium sm:text-base">{title}</p>
              <p className="text-xs text-white/60">Foto {active + 1} dari {images.length}</p>
            </div>
            <button
              type="button"
              onClick={() => setViewerOpen(false)}
              className="rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20"
              aria-label="Tutup galeri"
              autoFocus
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center">
            <StoredImage
              src={images[active]}
              alt={`${title} — foto ${active + 1} dari ${images.length}`}
              className="h-full max-h-full w-full rounded-lg object-contain"
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => select(active - 1)}
                  className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-2.5 text-white shadow-lg transition hover:bg-black/70 sm:left-4 sm:p-3"
                  aria-label="Foto sebelumnya"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => select(active + 1)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-2.5 text-white shadow-lg transition hover:bg-black/70 sm:right-4 sm:p-3"
                  aria-label="Foto berikutnya"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex shrink-0 justify-center gap-2 overflow-x-auto pt-3">
              {images.map((image, index) => (
                <button
                  key={`viewer-${image}-${index}`}
                  type="button"
                  onClick={() => setActive(index)}
                  className={`shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    index === active ? "border-gold opacity-100" : "border-transparent opacity-50 hover:opacity-90"
                  }`}
                  aria-label={`Tampilkan foto ${index + 1}`}
                  aria-current={index === active}
                >
                  <StoredImage src={image} alt="" className="h-12 w-16 object-cover sm:h-16 sm:w-24" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
