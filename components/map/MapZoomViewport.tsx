"use client";

import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Minus, Plus, RotateCcw } from "lucide-react";

type MapZoomViewportProps = {
  children: React.ReactNode;
};

const controlBtn =
  "flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white/95 text-slate-700 shadow-sm transition-colors hover:border-gold/40 hover:bg-gold/10 hover:text-gold-dark active:scale-95";

export function MapZoomViewport({ children }: MapZoomViewportProps) {
  return (
    <TransformWrapper
      initialScale={1}
      minScale={1}
      maxScale={5}
      centerOnInit
      limitToBounds={false}
      doubleClick={{ mode: "reset" }}
      panning={{ velocityDisabled: true }}
      wheel={{ step: 0.12 }}
      pinch={{ step: 5 }}
    >
      {({ zoomIn, zoomOut, resetTransform }) => (
        <div className="relative">
          <div className="absolute right-2 top-2 z-20 flex flex-col gap-1.5">
            <button
              type="button"
              aria-label="Perbesar peta"
              className={controlBtn}
              onClick={() => zoomIn()}
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Perkecil peta"
              className={controlBtn}
              onClick={() => zoomOut()}
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Reset zoom peta"
              className={controlBtn}
              onClick={() => resetTransform()}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          <div className="h-[min(70vh,28rem)] w-full touch-none overflow-hidden rounded-lg border border-slate-200 bg-[#f5f5f5] sm:h-[min(65vh,32rem)]">
            <TransformComponent
              wrapperClass="!h-full !w-full"
              contentClass="!w-full !p-3 sm:!p-4"
            >
              {children}
            </TransformComponent>
          </div>

          <p className="mt-2 text-center text-[11px] text-slate-400 md:hidden">
            Cubit untuk zoom · Geser untuk menggeser peta · Ketuk kavling untuk detail
          </p>
        </div>
      )}
    </TransformWrapper>
  );
}
