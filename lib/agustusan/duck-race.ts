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
 * Build per-duck final positions so only the server winner hits the finish line.
 * Non-winners stop just short; all movement is forward-only in the animator.
 */
export function buildDuckRaceCurves(
  labels: string[],
  winnerLabel: string,
  seed: number
): number[] {
  const winnerIdx = Math.max(
    0,
    labels.findIndex((l) => l === winnerLabel)
  );
  return labels.map((_, i) => {
    const hash = ((seed + i * 9973) % 1000) / 1000;
    if (i === winnerIdx) return 1;
    // Non-winners finish near the line (88%–97%), never past the winner
    return 0.88 + hash * 0.09;
  });
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
