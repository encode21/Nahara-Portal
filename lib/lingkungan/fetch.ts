import {
  LINGKUNGAN_LOCATION,
  LINGKUNGAN_REVALIDATE_SEC,
} from "@/lib/constants/lingkungan";
import { GUNUNG_STATUS } from "@/lib/lingkungan/labels";
import type {
  AirQualitySnapshot,
  LingkunganAlert,
  LingkunganSnapshot,
  WeatherSnapshot,
} from "@/lib/lingkungan/types";

const FETCH_INIT: RequestInit = {
  next: { revalidate: LINGKUNGAN_REVALIDATE_SEC },
  headers: {
    Accept: "application/json,text/html;q=0.9,*/*;q=0.8",
    "User-Agent": "NaharaPortal/1.0 (+https://nahara.id)",
  },
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function fetchWeather(): Promise<WeatherSnapshot> {
  const { latitude, longitude } = LINGKUNGAN_LOCATION;
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
  );
  url.searchParams.set("timezone", "Asia/Jakarta");

  const res = await fetch(url, FETCH_INIT);
  if (!res.ok) throw new Error(`cuaca HTTP ${res.status}`);
  const data = (await res.json()) as {
    current?: {
      time?: string;
      temperature_2m?: number;
      relative_humidity_2m?: number;
      apparent_temperature?: number;
      weather_code?: number;
      wind_speed_10m?: number;
    };
  };
  const c = data.current;
  if (!c?.time || c.temperature_2m == null || c.weather_code == null) {
    throw new Error("cuaca: respons tidak lengkap");
  }
  return {
    temperatureC: c.temperature_2m,
    feelsLikeC: c.apparent_temperature ?? c.temperature_2m,
    humidity: c.relative_humidity_2m ?? 0,
    windSpeedKmh: c.wind_speed_10m ?? 0,
    weatherCode: c.weather_code,
    observedAt: c.time,
  };
}

async function fetchAirQuality(): Promise<AirQualitySnapshot> {
  const { latitude, longitude } = LINGKUNGAN_LOCATION;
  const url = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("current", "european_aqi,pm10,pm2_5,us_aqi");
  url.searchParams.set("timezone", "Asia/Jakarta");

  const res = await fetch(url, FETCH_INIT);
  if (!res.ok) throw new Error(`udara HTTP ${res.status}`);
  const data = (await res.json()) as {
    current?: {
      time?: string;
      european_aqi?: number;
      us_aqi?: number;
      pm10?: number;
      pm2_5?: number;
    };
  };
  const c = data.current;
  if (!c?.time || c.us_aqi == null) throw new Error("udara: respons tidak lengkap");
  return {
    usAqi: c.us_aqi,
    europeanAqi: c.european_aqi ?? 0,
    pm25: c.pm2_5 ?? 0,
    pm10: c.pm10 ?? 0,
    observedAt: c.time,
  };
}

type BmkgGempa = {
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

function parseCoords(raw?: string): { lat: number; lon: number } | null {
  if (!raw) return null;
  const [a, b] = raw.split(",").map((s) => Number(s.trim()));
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return { lat: a, lon: b };
}

async function fetchGempaAlerts(): Promise<LingkunganAlert[]> {
  const res = await fetch(
    "https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json",
    FETCH_INIT,
  );
  if (!res.ok) throw new Error(`BMKG HTTP ${res.status}`);
  const data = (await res.json()) as { Infogempa?: { gempa?: BmkgGempa | BmkgGempa[] } };
  const list = data.Infogempa?.gempa;
  const gems = Array.isArray(list) ? list : list ? [list] : [];

  const { latitude, longitude } = LINGKUNGAN_LOCATION;
  const now = Date.now();
  const maxAgeMs = 72 * 60 * 60 * 1000;

  const alerts: LingkunganAlert[] = [];
  for (const g of gems) {
    const mag = Number(g.Magnitude);
    const coords = parseCoords(g.Coordinates);
    const occurredAt = g.DateTime;
    const ageOk = occurredAt ? now - new Date(occurredAt).getTime() <= maxAgeMs : true;
    if (!ageOk) continue;

    const distKm = coords
      ? haversineKm(latitude, longitude, coords.lat, coords.lon)
      : Number.POSITIVE_INFINITY;
    const nearby = distKm <= 450;
    const strong = Number.isFinite(mag) && mag >= 5;
    if (!nearby && !strong) continue;

    const distLabel = Number.isFinite(distKm) ? ` · ~${Math.round(distKm)} km dari cluster` : "";
    alerts.push({
      id: `gempa-${occurredAt ?? g.Tanggal}-${g.Magnitude}-${g.Wilayah}`,
      kind: "gempa",
      title: `Gempa M${g.Magnitude ?? "?"} — ${g.Wilayah ?? "Lokasi tidak diketahui"}`,
      detail: [
        g.Dirasakan ? `Dirasakan: ${g.Dirasakan}` : null,
        g.Kedalaman ? `Kedalaman ${g.Kedalaman}` : null,
        g.Potensi && !g.Dirasakan ? g.Potensi : null,
      ]
        .filter(Boolean)
        .join(" · ") + distLabel,
      levelLabel: `M${g.Magnitude ?? "?"}`,
      severity: strong || (Number.isFinite(mag) && mag >= 4.5 && nearby) ? "warning" : "watch",
      occurredAt: occurredAt ?? undefined,
      sourceUrl: "https://www.bmkg.go.id/gempabumi/gempabumi-dirasakan.bmkg",
      sourceName: "BMKG",
    });
  }

  return alerts.slice(0, 4);
}

type MagmaGunung = {
  ga_code: string;
  ga_nama_gapi: string;
  ga_prov_gapi: string;
  ga_status: number;
};

function extractMarkersJson(html: string): MagmaGunung[] {
  const marker = "markersGunungApi = ";
  const start = html.indexOf(marker);
  if (start < 0) throw new Error("Magma: markers tidak ditemukan");
  let i = start + marker.length;
  while (i < html.length && /\s/.test(html[i]!)) i += 1;
  if (html[i] !== "[") throw new Error("Magma: format markers tidak valid");
  let depth = 0;
  for (let j = i; j < html.length; j += 1) {
    const ch = html[j]!;
    if (ch === "[") depth += 1;
    else if (ch === "]") {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(html.slice(i, j + 1)) as MagmaGunung[];
      }
    }
  }
  throw new Error("Magma: gagal parse markers");
}

async function fetchGunungAlerts(): Promise<LingkunganAlert[]> {
  const res = await fetch("https://magma.esdm.go.id/", {
    ...FETCH_INIT,
    headers: {
      ...FETCH_INIT.headers,
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) throw new Error(`Magma HTTP ${res.status}`);
  const html = await res.text();
  const markers = extractMarkersJson(html);

  return markers
    .filter((g) => g.ga_status >= 3)
    .sort((a, b) => b.ga_status - a.ga_status || a.ga_nama_gapi.localeCompare(b.ga_nama_gapi))
    .slice(0, 6)
    .map((g) => {
      const meta = GUNUNG_STATUS[g.ga_status] ?? GUNUNG_STATUS[1]!;
      return {
        id: `gunung-${g.ga_code}-${g.ga_status}`,
        kind: "gunung" as const,
        title: `Gunung ${g.ga_nama_gapi} — Level ${meta.label}`,
        detail: `${g.ga_prov_gapi} · Status aktivitas vulkanik (PVMBG/MAGMA)`,
        levelLabel: meta.label,
        severity: meta.severity,
        sourceUrl: "https://magma.esdm.go.id/v1/gunung-api/tingkat-aktivitas",
        sourceName: "MAGMA PVMBG",
      };
    });
}

export async function getLingkunganSnapshot(): Promise<LingkunganSnapshot> {
  const errors: string[] = [];
  const [weatherRes, aqiRes, gempaRes, gunungRes] = await Promise.allSettled([
    fetchWeather(),
    fetchAirQuality(),
    fetchGempaAlerts(),
    fetchGunungAlerts(),
  ]);

  const weather = weatherRes.status === "fulfilled" ? weatherRes.value : null;
  const airQuality = aqiRes.status === "fulfilled" ? aqiRes.value : null;
  if (weatherRes.status === "rejected") errors.push("Cuaca gagal dimuat");
  if (aqiRes.status === "rejected") errors.push("Kualitas udara gagal dimuat");

  const alerts: LingkunganAlert[] = [];
  if (gunungRes.status === "fulfilled") alerts.push(...gunungRes.value);
  else errors.push("Status gunung api gagal dimuat");
  if (gempaRes.status === "fulfilled") alerts.push(...gempaRes.value);
  else errors.push("Data gempa BMKG gagal dimuat");

  // Siaga/Awas first, then gempa warnings
  alerts.sort((a, b) => {
    const rank = (s: LingkunganAlert["severity"]) =>
      s === "warning" ? 0 : s === "watch" ? 1 : 2;
    const kindRank = (k: LingkunganAlert["kind"]) => (k === "gunung" ? 0 : 1);
    return rank(a.severity) - rank(b.severity) || kindRank(a.kind) - kindRank(b.kind);
  });

  return {
    locationLabel: LINGKUNGAN_LOCATION.label,
    weather,
    airQuality,
    alerts: alerts.slice(0, 6),
    fetchedAt: new Date().toISOString(),
    errors,
  };
}
