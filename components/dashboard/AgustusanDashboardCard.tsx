"use client";

import Link from "next/link";
import { ArrowRight, Flag } from "lucide-react";
import type { EventEdition } from "@/lib/types";
import { AGUSTUSAN_YEAR } from "@/lib/constants/agustusan";

type Props = {
  edition: Pick<EventEdition, "id" | "year" | "title" | "status" | "starts_on" | "ends_on">;
};

/** Lightweight red/white/gold confetti scraps — scoped to the card */
function CardConfetti() {
  const pieces = Array.from({ length: 18 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl" aria-hidden>
      {pieces.map((i) => {
        const left = `${(i * 17 + 7) % 100}%`;
        const delay = `${(i % 6) * 0.35}s`;
        const duration = `${2.8 + (i % 5) * 0.35}s`;
        const color =
          i % 3 === 0 ? "#9b1b23" : i % 3 === 1 ? "#f5f5f4" : "#c9a84c";
        const rot = `${(i * 47) % 360}deg`;
        return (
          <span
            key={i}
            className="agustusan-confetti absolute top-[-12%] h-2 w-1.5 opacity-80"
            style={{
              left,
              backgroundColor: color,
              animationDelay: delay,
              animationDuration: duration,
              transform: `rotate(${rot})`,
            }}
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
