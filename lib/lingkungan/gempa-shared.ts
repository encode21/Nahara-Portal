/** Shared BMKG gempa constants + copy helpers (safe for client bundles). */

export const BMKG_GEMPA_DIRASAKAN_URL =
  "https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json";

export const BMKG_GEMPA_SOURCE_PAGE =
  "https://www.bmkg.go.id/gempabumi/gempabumi-dirasakan.bmkg";

/** Poll interval for dedicated gempa cron (seconds). */
export const GEMPA_POLL_SEC = 120;

export const GEMPA_FILTER = {
  maxAgeMs: 72 * 60 * 60 * 1000,
  nearbyKm: 450,
  strongMag: 5,
  regionalMag: 4,
  jabodetabekRadiusKm: 200,
} as const;

export function gempaShareText(alert: {
  title: string;
  detail?: string | null;
  levelLabel?: string | null;
  summary?: string | null;
  sourceUrl?: string | null;
  portalUrl: string;
}): string {
  const lines = [
    "🔔 Nahara Alert — Gempa BMKG",
    alert.summary ?? alert.title,
  ];
  if (alert.detail) lines.push(alert.detail);
  lines.push("Sumber: BMKG");
  if (alert.sourceUrl) lines.push(alert.sourceUrl);
  lines.push(alert.portalUrl);
  return lines.filter(Boolean).join("\n");
}
