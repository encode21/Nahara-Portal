"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CloudSun,
  Droplets,
  Expand,
  ExternalLink,
  Map,
  Mountain,
  Waves,
  Wind,
  X,
} from "lucide-react";
import {
  getWindyEmbedUrl,
  getWindyFullUrl,
  LINGKUNGAN_LOCATION,
} from "@/lib/constants/lingkungan";
import { usAqiBand, weatherLabelId } from "@/lib/lingkungan/labels";
import type { LingkunganSnapshot } from "@/lib/lingkungan/types";

type Props = {
  data: LingkunganSnapshot;
};

function aqiToneClass(tone: ReturnType<typeof usAqiBand>["tone"]): string {
  switch (tone) {
    case "good":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "moderate":
      return "bg-amber-50 text-amber-900 border-amber-200";
    case "unhealthySensitive":
      return "bg-orange-50 text-orange-900 border-orange-200";
    case "unhealthy":
      return "bg-red-50 text-red-800 border-red-200";
    case "veryUnhealthy":
      return "bg-purple-50 text-purple-900 border-purple-200";
    case "hazardous":
      return "bg-rose-950 text-rose-50 border-rose-900";
  }
}

function severityClass(severity: "info" | "watch" | "warning"): string {
  if (severity === "warning") return "border-red-200 bg-red-50";
  if (severity === "watch") return "border-amber-200 bg-amber-50";
  return "border-slate-100 bg-slate-50";
}

function formatObserved(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(
    iso.includes("T") && !iso.includes("+") && !iso.endsWith("Z")
      ? `${iso}:00+07:00`
      : iso,
  );
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

function WindyMapModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const embedUrl = getWindyEmbedUrl({ zoom: 8, overlay: "radar" });

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="windy-map-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Tutup peta"
      />

      <div className="relative z-10 flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl bg-[#0b1220] shadow-2xl sm:h-[88vh] sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-3 py-2.5 sm:px-4">
          <div className="min-w-0">
            <p id="windy-map-title" className="truncate text-sm font-semibold text-white">
              Peta cuaca Windy · {LINGKUNGAN_LOCATION.label}
            </p>
            <p className="truncate text-[11px] text-white/50">
              Radar, angin, hujan — geser & ganti layer di dalam peta
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <a
              href={getWindyFullUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Buka di Windy</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Tutup"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 bg-black">
          <iframe
            title="Peta cuaca Windy"
            src={embedUrl}
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
            allow="fullscreen; geolocation"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}

export function LingkunganDashboardCard({ data }: Props) {
  const [mapOpen, setMapOpen] = useState(false);
  const aqi = data.airQuality ? usAqiBand(data.airQuality.usAqi) : null;
  const weatherLabel = data.weather ? weatherLabelId(data.weather.weatherCode) : null;
  const observed =
    formatObserved(data.weather?.observedAt) ?? formatObserved(data.airQuality?.observedAt);
  const previewEmbedUrl = getWindyEmbedUrl({ zoom: 7, overlay: "radar" });

  return (
    <>
      <div className="glass-card overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Lingkungan & kewaspadaan
            </p>
            <h3 className="mt-1 font-display text-lg font-semibold text-slate-900">
              {data.locationLabel}
            </h3>
            {observed && (
              <p className="mt-0.5 text-xs text-slate-400">Pembaruan ~{observed} WIB</p>
            )}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/15">
            <CloudSun className="h-5 w-5 text-gold-dark" />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">Cuaca</p>
            {data.weather ? (
              <>
                <p className="mt-1 font-display text-3xl font-bold text-slate-900">
                  {Math.round(data.weather.temperatureC)}°
                  <span className="ml-1 text-base font-medium text-slate-500">C</span>
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">{weatherLabel}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Droplets className="h-3.5 w-3.5" />
                    {data.weather.humidity}%
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Wind className="h-3.5 w-3.5" />
                    {Math.round(data.weather.windSpeedKmh)} km/j
                  </span>
                  <span>Terasa {Math.round(data.weather.feelsLikeC)}°</span>
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Data cuaca tidak tersedia</p>
            )}
          </div>

          <div
            className={`rounded-lg border p-4 ${aqi ? aqiToneClass(aqi.tone) : "border-slate-100 bg-slate-50"}`}
          >
            <p className="text-xs font-medium opacity-80">Kualitas udara</p>
            {data.airQuality && aqi ? (
              <>
                <p className="mt-1 font-display text-3xl font-bold">
                  {Math.round(data.airQuality.usAqi)}
                  <span className="ml-1 text-sm font-medium opacity-70">US AQI</span>
                </p>
                <p className="mt-1 text-sm font-semibold">{aqi.label}</p>
                <p className="mt-3 text-xs opacity-80">
                  PM2.5 {Math.round(data.airQuality.pm25)} · PM10 {Math.round(data.airQuality.pm10)}{" "}
                  μg/m³
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Data udara tidak tersedia</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMapOpen(true)}
            className="group relative min-h-[148px] overflow-hidden rounded-lg border border-slate-800 bg-[#0b1220] text-left transition hover:border-gold/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:col-span-2 lg:col-span-1"
            aria-label="Buka peta cuaca Windy"
          >
            <iframe
              title="Pratinjau peta Windy"
              src={previewEmbedUrl}
              className="pointer-events-none absolute inset-0 h-[180%] w-full -translate-y-[12%] scale-[1.05] border-0 opacity-90"
              loading="lazy"
              tabIndex={-1}
              aria-hidden
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
            <div className="relative z-10 flex h-full min-h-[148px] flex-col justify-between p-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-black/45 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm">
                  <Map className="h-3.5 w-3.5" />
                  Peta Windy
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-white backdrop-blur-sm transition group-hover:bg-gold group-hover:text-[#3d2a0a]">
                  <Expand className="h-4 w-4" />
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Radar & angin Jabodetabek</p>
                <p className="mt-0.5 text-xs text-white/70">Ketuk untuk memperbesar</p>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-gold-dark" />
            <h4 className="font-display text-sm font-semibold text-slate-900">
              Alert bencana & gunung api
            </h4>
          </div>

          {data.alerts.length === 0 ? (
            <p className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
              Tidak ada alert Siaga/Awas atau gempa relevan dalam 72 jam terakhir.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.alerts.map((alert) => (
                <li key={alert.id}>
                  <a
                    href={alert.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block rounded-lg border px-3 py-2.5 transition hover:opacity-90 ${severityClass(alert.severity)}`}
                  >
                    <div className="flex items-start gap-2">
                      {alert.kind === "gunung" ? (
                        <Mountain className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
                      ) : (
                        <Waves className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-slate-900">{alert.title}</p>
                          {alert.levelLabel && (
                            <span className="rounded bg-white/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                              {alert.levelLabel}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{alert.detail}</p>
                        <p className="mt-1 text-[10px] text-slate-400">Sumber: {alert.sourceName}</p>
                      </div>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-4 text-[10px] leading-relaxed text-slate-400">
          Cuaca & AQI: Open-Meteo · Peta: Windy · Gempa: BMKG · Gunung api: MAGMA PVMBG. Bukan
          peringatan resmi evakuasi — ikuti instruksi pihak berwenang.
        </p>
        {data.errors.length > 0 && (
          <p className="mt-1 text-[10px] text-amber-700">{data.errors.join(" · ")}</p>
        )}
      </div>

      <WindyMapModal open={mapOpen} onClose={() => setMapOpen(false)} />
    </>
  );
}
