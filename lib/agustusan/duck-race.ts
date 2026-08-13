import type { DuckRaceParticipant, EventDuckRace } from "@/lib/types";

export const DUCK_RACE_FAIRNESS_STEPS = [
  "Sistem mengunci daftar rumah yang memenuhi syarat.",
  "Setiap rumah mendapatkan satu kesempatan.",
  "Sistem memilih pemenang secara acak.",
  "Hasil pemenang disimpan sebelum race dimulai.",
  "Animasi Duck Race kemudian menampilkan hasil tersebut.",
  "Hasil race dapat diperiksa kembali oleh panitia.",
] as const;

export function parseDuckRaceSnapshot(raw: unknown): DuckRaceParticipant[] {
  if (!Array.isArray(raw)) return [];
  const out: DuckRaceParticipant[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const household_label =
      typeof row.household_label === "string" ? row.household_label : null;
    const blok_row = typeof row.blok_row === "string" ? row.blok_row : null;
    const nomor_kavling =
      typeof row.nomor_kavling === "number"
        ? row.nomor_kavling
        : typeof row.nomor_kavling === "string"
          ? Number(row.nomor_kavling)
          : NaN;
    if (!household_label || !blok_row || !Number.isFinite(nomor_kavling)) continue;
    out.push({ household_label, blok_row, nomor_kavling });
  }
  return out;
}

export function normalizeDuckRace(row: EventDuckRace): EventDuckRace {
  return {
    ...row,
    participant_snapshot: parseDuckRaceSnapshot(row.participant_snapshot),
  };
}

export function formatDuckRaceWinnerHouse(race: EventDuckRace): string {
  if (!race.winner_blok_row || race.winner_nomor_kavling == null) {
    return race.winner_household_label ?? "—";
  }
  return `${race.winner_blok_row} — Rumah ${String(race.winner_nomor_kavling).padStart(2, "0")}`;
}

export function formatDuckRaceWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso)) + " WIB";
  } catch {
    return iso;
  }
}

/** Plain text for Copy → Paste → WhatsApp */
export function buildDuckRaceWhatsAppText(race: EventDuckRace): string {
  const winnerLabel = race.winner_household_label ?? "—";
  const blok = race.winner_blok_row ?? "—";
  const rumah =
    race.winner_nomor_kavling != null
      ? String(race.winner_nomor_kavling).padStart(2, "0")
      : "—";
  return [
    "🇮🇩 NAHARA 81 TAHUN INDONESIA",
    "",
    "🦆 HASIL DUCK RACE",
    "HADIAH UTAMA",
    "",
    "Peserta:",
    `${race.participant_count} rumah`,
    "",
    "Metode:",
    "Pengundian acak oleh sistem",
    "",
    "Race ID:",
    race.race_code,
    "",
    "🏆 PEMENANG:",
    "",
    winnerLabel,
    `BLOK ${blok} - RUMAH ${rumah}`,
    "",
    "Selamat kepada pemenang! 🎉",
    "",
    "Pengundian dilakukan secara acak oleh sistem",
    "dan hasilnya tersimpan dalam Portal Nahara",
    "sebagai dokumentasi panitia.",
  ].join("\n");
}

/**
 * Deterministic 0–1 hash (visual only — does not pick the winner).
 */
function hash01(seed: number, i: number, salt: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233 + salt * 45.164) * 43758.5453;
  return x - Math.floor(x);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Monotonic keyframes: progress only moves forward over time. */
export type DuckMotionProfile = {
  times: number[];
  positions: number[];
};

/**
 * Per-duck speed profiles so the pack looks chaotic mid-race,
 * while only the server winner reaches the finish line.
 */
export function buildDuckMotionProfiles(
  labels: string[],
  winnerLabel: string,
  seed: number
): DuckMotionProfile[] {
  const winnerIdx = Math.max(
    0,
    labels.findIndex((l) => l === winnerLabel)
  );

  return labels.map((_, i) => {
    const r = (salt: number) => hash01(seed, i, salt);
    const isWinner = i === winnerIdx;
    const style = Math.floor(r(2) * 3); // 0 early rabbit, 1 steady, 2 late push

    const final = isWinner ? 1 : 0.48 + r(1) * 0.44; // non-winners end 48%–92%

    let p1: number;
    let p2: number;
    let p3: number;

    if (isWinner) {
      // Contested mid-pack early — late surge so winner isn't obvious from the start
      p1 = 0.06 + r(3) * 0.14;
      p2 = 0.22 + r(4) * 0.2;
      p3 = 0.52 + r(5) * 0.16;
    } else if (style === 0) {
      // Early rabbit: leads early, fades before the line
      p1 = 0.2 + r(3) * 0.28;
      p2 = Math.min(final - 0.1, p1 + 0.12 + r(4) * 0.22);
      p3 = Math.min(final - 0.03, p2 + 0.06 + r(5) * 0.14);
    } else if (style === 1) {
      // Steady middle pack
      p1 = final * (0.12 + r(3) * 0.12);
      p2 = final * (0.35 + r(4) * 0.15);
      p3 = final * (0.65 + r(5) * 0.15);
    } else {
      // Slow start, late chase (still short of finish)
      p1 = 0.03 + r(3) * 0.08;
      p2 = 0.12 + r(4) * 0.16;
      p3 = final * (0.5 + r(5) * 0.25);
    }

    p1 = clamp(p1, 0.02, final - 0.08);
    p2 = clamp(Math.max(p2, p1 + 0.05), p1 + 0.04, final - 0.04);
    p3 = clamp(Math.max(p3, p2 + 0.05), p2 + 0.04, final - 0.01);

    return {
      times: [0, 0.18, 0.42, 0.68, 1],
      positions: [0, p1, p2, p3, final],
    };
  });
}

/** Sample progress at time t ∈ [0,1] — always forward-only. */
export function sampleDuckProgress(
  t: number,
  profile: DuckMotionProfile
): number {
  const { times, positions } = profile;
  if (t <= 0) return 0;
  if (t >= 1) return positions[positions.length - 1] ?? 0;

  let i = 0;
  while (i < times.length - 1 && t > times[i + 1]) i += 1;
  const t0 = times[i] ?? 0;
  const t1 = times[i + 1] ?? 1;
  const p0 = positions[i] ?? 0;
  const p1 = positions[i + 1] ?? p0;
  const u = (t - t0) / Math.max(1e-6, t1 - t0);
  // smoothstep within segment — accel/decel without reversing
  const s = u * u * (3 - 2 * u);
  return p0 + (p1 - p0) * s;
}

/** @deprecated Prefer buildDuckMotionProfiles — kept for simple final positions. */
export function buildDuckRaceCurves(
  labels: string[],
  winnerLabel: string,
  seed: number
): number[] {
  return buildDuckMotionProfiles(labels, winnerLabel, seed).map(
    (p) => p.positions[p.positions.length - 1] ?? 0
  );
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
