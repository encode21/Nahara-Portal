"use client";

import Image from "next/image";
import { LOGO_BADGE_SRC } from "@/lib/constants/brand";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

const sizeMap: Record<Size, { wrap: string; badge: number; ring: string }> = {
  sm: { wrap: "h-12 w-12", badge: 28, ring: "inset-0" },
  md: { wrap: "h-20 w-20", badge: 48, ring: "inset-0" },
  lg: { wrap: "h-28 w-28", badge: 72, ring: "inset-0" },
};

/** Animated Nahara badge with orbiting gold rings. */
export function NaharaLoaderMark({
  size = "md",
  className,
  label = "Memuat",
}: {
  size?: Size;
  className?: string;
  label?: string;
}) {
  const s = sizeMap[size];

  return (
    <div
      className={cn("relative flex flex-col items-center gap-4", className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className={cn("relative", s.wrap)}>
        <span className="nahara-loader-ring nahara-loader-ring-a absolute inset-0" />
        <span className="nahara-loader-ring nahara-loader-ring-b absolute inset-[10%]" />
        <span className="nahara-loader-glow absolute inset-[18%] rounded-full" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src={LOGO_BADGE_SRC}
            alt=""
            width={s.badge}
            height={s.badge}
            className="nahara-loader-badge h-auto w-[58%] object-contain drop-shadow-md"
            priority
            aria-hidden
          />
        </div>
      </div>
      {size !== "sm" && (
        <div className="text-center">
          <p className="font-display text-sm font-semibold tracking-[0.18em] text-ink">
            NAHARA
          </p>
          <p className="mt-1 text-[11px] font-medium text-ink-faint">
            {label}
            <span className="nahara-loader-dots" aria-hidden>
              …
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

export function NaharaPageLoader({
  label = "Memuat halaman",
}: {
  label?: string;
}) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center py-16">
      <NaharaLoaderMark size="md" label={label} />
    </div>
  );
}
