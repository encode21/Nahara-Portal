import { createHash } from "crypto";
import { LINGKUNGAN_LOCATION } from "@/lib/constants/lingkungan";
import {
  BMKG_GEMPA_DIRASAKAN_URL,
  BMKG_GEMPA_SOURCE_PAGE,
  GEMPA_FILTER,
  GEMPA_POLL_SEC,
  gempaShareText,
} from "@/lib/lingkungan/gempa-shared";
import type { LingkunganAlert } from "@/lib/lingkungan/types";

export {
  BMKG_GEMPA_DIRASAKAN_URL,
  BMKG_GEMPA_SOURCE_PAGE,
  GEMPA_FILTER,
  GEMPA_POLL_SEC,
  gempaShareText,
};

export type BmkgGempaRaw = {
  Tanggal?: string;
  Jam?: string;
  DateTime?: string;
  Coordinates?: string;
  Magnitude?: string;
  Kedalaman?: string;
  Wilayah?: string;
  Potensi?: string;
  Dirasakan?: string;
};

export type GempaAlert = LingkunganAlert & {
  kind: "gempa";
  magnitude: number | null;
  distKm: number | null;
};

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseCoords(raw?: string): { lat: number; lon: number } | null {
  if (!raw) return null;
  const [a, b] = raw.split(",").map((s) => Number(s.trim()));
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return { lat: a, lon: b };
}

export function gempaStableKey(g: BmkgGempaRaw): string {
  return `gempa-${g.DateTime ?? g.Tanggal ?? ""}-${g.Magnitude ?? ""}-${g.Wilayah ?? ""}`;
}

/** Deterministic UUID from BMKG event key (for notification source_id). */
export function gempaSourceUuid(stableKey: string): string {
  const h = createHash("sha256")
    .update(`nahara:bmkg_gempa:${stableKey}`)
    .digest();
  const bytes = Buffer.from(h.subarray(0, 16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export function isRelevantGempa(mag: number, distKm: number): boolean {
  const nearby = distKm <= GEMPA_FILTER.nearbyKm;
  const strong = Number.isFinite(mag) && mag >= GEMPA_FILTER.strongMag;
  const regional =
    Number.isFinite(mag) &&
    mag >= GEMPA_FILTER.regionalMag &&
    distKm <= GEMPA_FILTER.jabodetabekRadiusKm;
  return nearby || strong || regional;
}

export function mapBmkgGempaToAlert(g: BmkgGempaRaw): GempaAlert | null {
  const mag = Number(g.Magnitude);
  const coords = parseCoords(g.Coordinates);
  const occurredAt = g.DateTime;
  const now = Date.now();
  const ageOk = occurredAt
    ? now - new Date(occurredAt).getTime() <= GEMPA_FILTER.maxAgeMs
    : true;
  if (!ageOk) return null;

  const { latitude, longitude } = LINGKUNGAN_LOCATION;
  const distKm = coords
    ? haversineKm(latitude, longitude, coords.lat, coords.lon)
    : Number.POSITIVE_INFINITY;

  const magOk = Number.isFinite(mag) ? mag : 0;
  if (!isRelevantGempa(magOk, distKm)) return null;

  const strong = Number.isFinite(mag) && mag >= GEMPA_FILTER.strongMag;
  const nearby = distKm <= GEMPA_FILTER.nearbyKm;
  const distLabel = Number.isFinite(distKm)
    ? ` · ~${Math.round(distKm)} km dari cluster`
    : "";

  const stableKey = gempaStableKey(g);

  return {
    id: stableKey,
    kind: "gempa",
    title: `Gempa M${g.Magnitude ?? "?"} — ${g.Wilayah ?? "Lokasi tidak diketahui"}`,
    detail:
      [
        g.Dirasakan ? `Dirasakan: ${g.Dirasakan}` : null,
        g.Kedalaman ? `Kedalaman ${g.Kedalaman}` : null,
        g.Potensi && !g.Dirasakan ? g.Potensi : null,
      ]
        .filter(Boolean)
        .join(" · ") + distLabel,
    levelLabel: `M${g.Magnitude ?? "?"}`,
    severity:
      strong || (Number.isFinite(mag) && mag >= 4.5 && nearby)
        ? "warning"
        : "watch",
    occurredAt: occurredAt ?? undefined,
    sourceUrl: BMKG_GEMPA_SOURCE_PAGE,
    sourceName: "BMKG",
    magnitude: Number.isFinite(mag) ? mag : null,
    distKm: Number.isFinite(distKm) ? distKm : null,
  };
}

export function parseBmkgGempaPayload(data: unknown): BmkgGempaRaw[] {
  const root = data as { Infogempa?: { gempa?: BmkgGempaRaw | BmkgGempaRaw[] } };
  const list = root.Infogempa?.gempa;
  if (Array.isArray(list)) return list;
  if (list) return [list];
  return [];
}

type FetchGempaOptions = {
  cache?: RequestCache;
  revalidateSec?: number;
  limit?: number;
};

export async function fetchGempaAlerts(
  opts: FetchGempaOptions = {}
): Promise<GempaAlert[]> {
  const init: RequestInit & { next?: { revalidate: number } } = {
    headers: {
      Accept: "application/json",
      "User-Agent": "NaharaPortal/1.0 (+https://nahara.id)",
    },
  };
  if (opts.cache === "no-store") {
    init.cache = "no-store";
  } else {
    init.next = { revalidate: opts.revalidateSec ?? 15 * 60 };
  }

  const res = await fetch(BMKG_GEMPA_DIRASAKAN_URL, init);
  if (!res.ok) throw new Error(`BMKG HTTP ${res.status}`);
  const data = await res.json();
  const gems = parseBmkgGempaPayload(data);

  const alerts: GempaAlert[] = [];
  for (const g of gems) {
    const alert = mapBmkgGempaToAlert(g);
    if (alert) alerts.push(alert);
  }
  return alerts.slice(0, opts.limit ?? 4);
}

export function gempaNotificationCopy(alert: GempaAlert): {
  title: string;
  message: string;
} {
  const mag = alert.levelLabel ?? "M?";
  const wilayah =
    alert.title.split("—")[1]?.trim() ?? "Lokasi tidak diketahui";
  const dist =
    alert.distKm != null ? ` · ~${Math.round(alert.distKm)} km dari cluster` : "";
  return {
    title: "Gempa BMKG",
    message: `${mag} — ${wilayah}${dist}`,
  };
}
