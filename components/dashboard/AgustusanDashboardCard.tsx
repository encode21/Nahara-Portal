"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, Flag } from "lucide-react";
import type { EventEdition } from "@/lib/types";
import { AGUSTUSAN_YEAR } from "@/lib/constants/agustusan";

type Props = {
  edition: Pick<EventEdition, "id" | "year" | "title" | "status" | "starts_on" | "ends_on">;
};

const CONFETTI = Array.from({ length: 28 }, (_, i) => {
  const shapes = ["rect", "square", "dot"] as const;
  return {
    id: i,
    left: `${(i * 13 + 5) % 96}%`,
    delay: `${(i % 8) * 0.28}s`,
    duration: `${3.2 + (i % 6) * 0.4}s`,
    // white / gold / soft pink — contrast on red bg (no solid red)
    color: i % 3 === 0 ? "#fff8e7" : i % 3 === 1 ? "#f0d78c" : "#ffc9ce",
    shape: shapes[i % 3],
    drift: `${(i % 2 === 0 ? 1 : -1) * (18 + (i % 5) * 8)}px`,
    size: 6 + (i % 5) * 2,
  };
});

function CardConfetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl" aria-hidden>
      {CONFETTI.map((p) => {
        const style: CSSProperties = {
          left: p.left,
          backgroundColor: p.color,
          width: p.shape === "dot" ? p.size : p.shape === "square" ? p.size : Math.round(p.size * 0.55),
          height: p.shape === "dot" ? p.size : p.shape === "square" ? p.size : Math.round(p.size * 1.4),
          borderRadius: p.shape === "dot" ? "9999px" : "1px",
          animationDelay: p.delay,
          animationDuration: p.duration,
          // custom property used by keyframes for horizontal drift
          ["--confetti-drift" as string]: p.drift,
        };
        return <span key={p.id} className="agustusan-confetti absolute" style={style} />;
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
      {/* soft highlight so motion pops a bit more */}
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
