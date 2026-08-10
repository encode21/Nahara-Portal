"use client";

import { useEffect } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Minus, Plus, RotateCcw, X } from "lucide-react";
import { isPortalStorageUrl } from "@/lib/supabase/storage";

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

  const valid = isPortalStorageUrl(src);

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
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

      {!valid ? (
        <button
          type="button"
          className="absolute inset-0 flex items-center justify-center text-sm text-white/70"
          onClick={onClose}
        >
          Gambar tidak valid
        </button>
      ) : (
        <TransformWrapper
          initialScale={1}
          minScale={1}
          maxScale={5}
          centerOnInit
          centerZoomedOut
          limitToBounds
          doubleClick={{ mode: "toggle", step: 0.7 }}
          panning={{ velocityDisabled: true }}
          wheel={{ step: 0.12 }}
          pinch={{ step: 5 }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-xl bg-black/55 p-1.5 backdrop-blur-sm">
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

              {/* Area penuh viewport supaya TransformComponent center di desktop */}
              <div
                className="absolute inset-0 touch-none pt-14 pb-24"
                onClick={onClose}
              >
                <TransformComponent
                  wrapperStyle={{
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                  }}
                  contentStyle={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={alt}
                    draggable={false}
                    onClick={(e) => e.stopPropagation()}
                    className="max-h-full max-w-full select-none object-contain"
                    style={{
                      width: "auto",
                      height: "auto",
                      maxHeight: "100%",
                      maxWidth: "min(100%, 56rem)",
                    }}
                  />
                </TransformComponent>
              </div>

              <p className="pointer-events-none absolute bottom-20 left-0 right-0 z-20 text-center text-[11px] text-white/50 md:hidden">
                Cubit untuk zoom · Ketuk dua kali untuk perbesar
              </p>
            </>
          )}
        </TransformWrapper>
      )}
    </div>
  );
}
