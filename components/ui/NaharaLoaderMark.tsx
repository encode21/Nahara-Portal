"use client";

import Image from "next/image";
import { LOGO_BADGE_SRC } from "@/lib/constants/brand";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: { wrap: "h-14 w-14", badge: 36, ring: "inset-1" },
  md: { wrap: "h-20 w-20", badge: 52, ring: "inset-1.5" },
  lg: { wrap: "h-28 w-28", badge: 72, ring: "inset-2" },
};

/** Premium Nahara loader mark — orbiting gold rings around the official badge. */
export function NaharaLoaderMark({
  className,
  label = "Memuat",
  size = "md",
}: Props) {
  const s = sizeMap[size];

  return (
    <div
      className={cn("flex flex-col items-center gap-4", className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className={cn("relative", s.wrap)}>
        <span
          className="nahara-loader-ring absolute inset-0 rounded-full"
          aria-hidden
        />
        <span
          className="nahara-loader-ring-slow absolute inset-[-6px] rounded-full"
          aria-hidden
        />
        <span
          className="nahara-loader-glow absolute inset-2 rounded-full"
          aria-hidden
        />
        <div
          className={cn(
            "absolute flex items-center justify-center rounded-full bg-white/90 shadow-soft",
            s.ring,
          )}
        >
          <Image
            src={LOGO_BADGE_SRC}
            alt=""
            width={s.badge}
            height={s.badge}
            className="h-[70%] w-[70%] object-contain"
            priority
            aria-hidden
          />
        </div>
      </div>
      {label && (
        <p className="font-display text-xs font-semibold tracking-[0.22em] text-gold-dark uppercase">
          {label}
          <span className="nahara-loader-dots" aria-hidden>
            …
          </span>
        </p>
      )}
    </div>
  );
}
