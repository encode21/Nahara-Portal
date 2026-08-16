import type { DuckRaceParticipant, EventDuckRace } from "@/lib/types";

export const DUCK_RACE_KAHOOT_JOIN_HOST = "www.kahoot.it";
export const DUCK_RACE_KAHOOT_PIN_KEY = "nahara:duck-race:kahoot-pin";

export function normalizeKahootPin(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 8);
}

export function formatKahootPin(raw: string): string {
  const d = normalizeKahootPin(raw);
  if (d.length <= 3) return d;
  return `${d.slice(0, 3)} ${d.slice(3)}`;
}

export function kahootJoinUrl(pin: string): string {
  const d = normalizeKahootPin(pin);
  return d ? `https://kahoot.it/?pin=${d}` : "https://kahoot.it/";
}

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

type SpeedWave = { amp: number; freq: number; phase: number };

/**
 * Continuous speed profile: progress = integral of always-positive speed.
 * Overtaking comes from overlapping sine waves — no staged “sudden surge”.
 */
export type DuckMotionProfile = {
  final: number;
  waves: SpeedWave[];
};

/** ∫₀ᵗ (1 + Σ amp·sin(2π·freq·s + phase)) ds — speed stays > 0 when Σ|amp| < 1. */
function integrateSpeed(t: number, waves: SpeedWave[]): number {
  let s = t;
  for (const w of waves) {
    const omega = Math.PI * 2 * w.freq;
    if (omega < 1e-6) continue;
    s += (w.amp / omega) * (Math.cos(w.phase) - Math.cos(omega * t + w.phase));
  }
  return s;
}

/**
 * Per-duck continuous speed profiles: pack salip-menyalip sepanjang race,
 * hanya pemenang server yang sampai finish (final = 1).
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

    // Spread finish positions so the pack doesn't look "lined up"
    const final = isWinner ? 1 : 0.52 + r(1) * 0.4; // 52%–92%

    // 2 soft waves — gentle lead changes, never a hard acceleration switch
    const waves: SpeedWave[] = [
      {
        amp: 0.18 + r(3) * 0.22, // 0.18–0.40
        freq: 0.7 + r(4) * 0.6, // ~0.7–1.3 cycles over the race
        phase: r(5) * Math.PI * 2,
      },
      {
        amp: 0.1 + r(6) * 0.16, // 0.10–0.26
        freq: 1.3 + r(7) * 0.9, // ~1.3–2.2 — finer salip-salipan
        phase: r(8) * Math.PI * 2,
      },
    ];

    // Winner uses same style of waves so they don't look scripted — only final=1 differs
    if (isWinner) {
      waves[0] = {
        amp: 0.2 + r(3) * 0.18,
        freq: 0.75 + r(4) * 0.5,
        phase: r(5) * Math.PI * 2,
      };
      waves[1] = {
        amp: 0.12 + r(6) * 0.14,
        freq: 1.4 + r(7) * 0.7,
        phase: r(8) * Math.PI * 2,
      };
    }

    return { final, waves };
  });
}

/** Sample progress at time t ∈ [0,1] — always forward-only, continuous overtaking. */
export function sampleDuckProgress(
  t: number,
  profile: DuckMotionProfile
): number {
  if (t <= 0) return 0;
  if (t >= 1) return profile.final;

  const total = integrateSpeed(1, profile.waves);
  if (total <= 1e-6) return profile.final * t;

  const at = integrateSpeed(t, profile.waves);
  return profile.final * clamp01(at / total);
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/** Final positions only (for end-of-race snap). */
export function buildDuckRaceCurves(
  labels: string[],
  winnerLabel: string,
  seed: number
): number[] {
  return buildDuckMotionProfiles(labels, winnerLabel, seed).map((p) => p.final);
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
