"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, Flag } from "lucide-react";
import type { EventEdition } from "@/lib/types";
import { AGUSTUSAN_YEAR } from "@/lib/constants/agustusan";

type Props = {
  edition: Pick<EventEdition, "id" | "year" | "title" | "status" | "starts_on" | "ends_on">;
};

const COLORS = [
  "#ffd166",
  "#06d6a0",
  "#118ab2",
  "#ef476f",
  "#f7fff7",
  "#ff9f1c",
  "#9b5de5",
  "#00bbf9",
  "#fee440",
  "#f15bb5",
  "#c9a84c",
  "#ffffff",
];

const SHAPES = ["rect", "square", "dot"] as const;

/** One-shot burst: left & right bottom → up (deterministic, no loop) */
const CONFETTI = Array.from({ length: 36 }, (_, i) => {
  const side: "left" | "right" = i % 2 === 0 ? "left" : "right";
  const n = Math.floor(i / 2);
  // fan upward into the card from each corner
  const angleDeg = side === "left" ? -75 + (n % 9) * 9 : -105 - (n % 9) * 9;
  const dist = 110 + (n % 6) * 28; // px upward travel
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.round(Math.cos(rad) * dist);
  const dy = Math.round(Math.sin(rad) * dist); // sin negative = up
  const fall = 160 + (n % 7) * 24; // px fall past bottom
  const shape = SHAPES[i % 3];
  const size = 7 + (i % 5) * 2;

  return {
    id: i,
    side,
    color: COLORS[i % COLORS.length],
    shape,
    size,
    delay: `${0.05 + (n % 8) * 0.04}s`,
    duration: `${1.6 + (n % 5) * 0.15}s`,
    dx: `${dx}px`,
    dy: `${dy}px`,
    dxPeak: `${Math.round(dx * 0.85)}px`,
    dyPeak: `${dy}px`,
    fall: `${fall}px`,
    spin: `${(i % 2 === 0 ? 1 : -1) * (320 + (i % 4) * 100)}deg`,
    spinPeak: `${(i % 2 === 0 ? 1 : -1) * Math.round((320 + (i % 4) * 100) * 0.45)}deg`,
    width: shape === "dot" ? size : shape === "square" ? size : Math.round(size * 0.5),
    height: shape === "dot" ? size : shape === "square" ? size : Math.round(size * 1.5),
    radius: shape === "dot" ? "9999px" : "1px",
  };
});

function CardConfetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl" aria-hidden>
      {CONFETTI.map((p) => {
        const style: CSSProperties = {
          backgroundColor: p.color,
          width: p.width,
          height: p.height,
          borderRadius: p.radius,
          animationDelay: p.delay,
          animationDuration: p.duration,
          ["--c-dx" as string]: p.dx,
          ["--c-dy" as string]: p.dy,
          ["--c-dx-peak" as string]: p.dxPeak,
          ["--c-dy-peak" as string]: p.dyPeak,
          ["--c-fall" as string]: p.fall,
          ["--c-spin" as string]: p.spin,
          ["--c-spin-peak" as string]: p.spinPeak,
          ...(p.side === "left"
            ? { left: "4%", bottom: "6%" }
            : { right: "4%", bottom: "6%" }),
        };
        return (
          <span
            key={p.id}
            className={
              p.side === "left"
                ? "agustusan-confetti agustusan-confetti--left absolute"
                : "agustusan-confetti agustusan-confetti--right absolute"
            }
            style={style}
          />
        );
      })}
    </div>
  );
}

export function AgustusanDashboardCard({ edition }: Props) {
  const year = edition.year || AGUSTUSAN_YEAR;
  const href = `/kegiatan/agustusan/${year}`;

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#9b1b23]/20 bg-gradient-to-br from-[#7a1218] via-[#9b1b23] to-[#5c0e14] p-6 text-white shadow-sm">
      <CardConfetti />
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[#f0d78c]/15 blur-2xl"
        aria-hidden
      />
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-md bg-white/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#f0d78c]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f0d78c] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#f0d78c]" />
              </span>
              Event tahunan · Sedang berjalan
            </p>
            <h3 className="mt-3 font-display text-xl font-bold leading-snug sm:text-2xl">
              {edition.title}
            </h3>
            <p className="mt-1.5 text-sm text-white/80">
              Lomba, twibbon, galeri & kebersamaan warga Nahara — meriah yuk!
            </p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
            <Flag className="h-5 w-5 text-[#f0d78c]" />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={href}
            className="inline-flex items-center rounded-lg bg-[#c9a84c] px-3.5 py-2 text-sm font-semibold text-[#3d2a0a] transition hover:bg-[#d4b85a]"
          >
            Buka Agustusan
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
          <Link
            href={`${href}/twibbon`}
            className="inline-flex items-center rounded-lg border border-white/30 bg-white/10 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            Buat Twibbon
          </Link>
          <Link
            href={`${href}/lomba`}
            className="inline-flex items-center rounded-lg border border-white/30 bg-white/10 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            Jadwal Lomba
          </Link>
        </div>
      </div>
    </div>
  );
}
