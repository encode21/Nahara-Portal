"use client";

import { useEffect } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Minus, Plus, RotateCcw, X } from "lucide-react";
import { StoredImage } from "@/components/ui/StoredImage";

type ImageLightboxProps = {
  src: string;
  alt: string;
  open: boolean;
  onClose: () => void;
};

const controlBtn =
  "flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95";

export function ImageLightbox({ src, alt, open, onClose }: ImageLightboxProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-black/92"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 px-3 py-3 sm:px-4">
        <p className="min-w-0 truncate text-sm text-white/80">{alt}</p>
        <button
          type="button"
          onClick={onClose}
          className={controlBtn}
          aria-label="Tutup foto"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <TransformWrapper
        initialScale={1}
        minScale={1}
        maxScale={5}
        centerOnInit
        limitToBounds
        doubleClick={{ mode: "toggle", step: 0.7 }}
        panning={{ velocityDisabled: true }}
        wheel={{ step: 0.12 }}
        pinch={{ step: 5 }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-xl bg-black/50 p-1.5 backdrop-blur-sm">
              <button
                type="button"
                aria-label="Perkecil"
                className={controlBtn}
                onClick={() => zoomOut()}
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Perbesar"
                className={controlBtn}
                onClick={() => zoomIn()}
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Reset zoom"
                className={controlBtn}
                onClick={() => resetTransform()}
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            <div
              className="flex min-h-0 flex-1 touch-none items-center justify-center overflow-hidden px-2 pb-20"
              onClick={onClose}
            >
              <TransformComponent
                wrapperClass="!h-full !w-full !flex !items-center !justify-center"
                contentClass="!flex !max-h-full !max-w-full !items-center !justify-center"
              >
                <div
                  className="max-h-[min(85vh,100%)] max-w-[min(100vw-1rem,56rem)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <StoredImage
                    src={src}
                    alt={alt}
                    className="max-h-[min(85vh,100%)] w-auto max-w-full object-contain"
                  />
                </div>
              </TransformComponent>
            </div>

            <p className="pointer-events-none absolute bottom-20 left-0 right-0 text-center text-[11px] text-white/50 md:hidden">
              Cubit untuk zoom · Ketuk dua kali untuk perbesar
            </p>
          </div>
        )}
      </TransformWrapper>
    </div>
  );
}
