import {
  AlertTriangle,
  CloudSun,
  Droplets,
  Mountain,
  Waves,
  Wind,
} from "lucide-react";
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
  const d = new Date(iso.includes("T") && !iso.includes("+") && !iso.endsWith("Z") ? `${iso}:00+07:00` : iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

export function LingkunganDashboardCard({ data }: Props) {
  const aqi = data.airQuality ? usAqiBand(data.airQuality.usAqi) : null;
  const weatherLabel = data.weather ? weatherLabelId(data.weather.weatherCode) : null;
  const observed =
    formatObserved(data.weather?.observedAt) ?? formatObserved(data.airQuality?.observedAt);

  return (
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

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
        Cuaca & AQI: Open-Meteo · Gempa: BMKG · Gunung api: MAGMA PVMBG. Bukan peringatan resmi
        evakuasi — ikuti instruksi pihak berwenang.
      </p>
      {data.errors.length > 0 && (
        <p className="mt-1 text-[10px] text-amber-700">{data.errors.join(" · ")}</p>
      )}
    </div>
  );
}
