"use client";

import type { DuckRaceParticipant } from "@/lib/types";

type Props = {
  participants: DuckRaceParticipant[];
  /** 0–1 progress per participant (same order as participants) */
  progress: number[];
  winnerLabel: string | null;
  racing: boolean;
  finished: boolean;
};

export function DuckRaceTrack({
  participants,
  progress,
  winnerLabel,
  racing,
  finished,
}: Props) {
  const count = participants.length;
  const laneH =
    count <= 12 ? 44 : count <= 30 ? 32 : count <= 60 ? 24 : count <= 100 ? 18 : 14;
  const fontPx =
    count <= 12 ? 14 : count <= 30 ? 12 : count <= 60 ? 11 : count <= 100 ? 10 : 9;
  const duckSize =
    count <= 12 ? "text-2xl" : count <= 30 ? "text-xl" : count <= 60 ? "text-base" : "text-sm";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-[#120308] ring-1 ring-white/10">
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-3 py-2 text-[10px] font-semibold tracking-[0.2em] text-[#f0d78c] uppercase sm:px-4 sm:text-xs">
        <span>START</span>
        <span>FINISH</span>
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        {/* finish line */}
        <div
          className="pointer-events-none absolute bottom-0 right-[8%] top-0 z-[1] w-0.5 bg-gradient-to-b from-[#f0d78c]/80 via-white/60 to-[#f0d78c]/80"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 left-[12%] top-0 z-[1] w-px bg-white/20"
          aria-hidden
        />

        <ul className="relative z-0 py-1">
          {participants.map((p, i) => {
            const pct = Math.max(0, Math.min(1, progress[i] ?? 0));
            const isWinner =
              finished && winnerLabel != null && p.household_label === winnerLabel;
            const wobble =
              racing && pct > 0.02 && pct < 0.98
                ? Math.sin(pct * 40 + i) * 2
                : 0;

            return (
              <li
                key={p.household_label}
                className={`relative flex items-center border-b border-white/[0.06] ${
                  isWinner ? "bg-[#c9a84c]/15" : i % 2 === 0 ? "bg-white/[0.03]" : ""
                }`}
                style={{ height: laneH }}
              >
                <span
                  className="z-[2] w-[12%] shrink-0 truncate px-1 text-right font-semibold tabular-nums text-white/90 sm:px-2"
                  style={{ fontSize: fontPx }}
                >
                  {p.household_label}
                </span>
                <div className="relative h-full flex-1">
                  <span
                    className={`absolute top-1/2 left-0 inline-block -translate-y-1/2 will-change-transform ${duckSize} ${
                      isWinner ? "drop-shadow-[0_0_8px_#f0d78c]" : ""
                    }`}
                    style={{
                      transform: `translate3d(calc(${pct * 88}% + ${wobble}px), -50%, 0)`,
                    }}
                    aria-hidden
                  >
                    🦆
                  </span>
                  {isWinner && (
                    <span
                      className="absolute top-1/2 right-[2%] -translate-y-1/2 text-lg sm:text-xl"
                      aria-hidden
                    >
                      🏆
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {participants.length === 0 && (
          <p className="px-4 py-16 text-center text-sm text-white/50">
            Belum ada rumah eligible.
          </p>
        )}
      </div>
    </div>
  );
}
