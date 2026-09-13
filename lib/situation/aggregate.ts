import { usAqiBand, weatherLabelId } from "@/lib/lingkungan/labels";
import type { LingkunganSnapshot } from "@/lib/lingkungan/types";
import { EMERGENCY_KIND_LABEL } from "@/lib/constants/emergency";
import type { EmergencyIncident } from "@/lib/types";
import { formatRelativeId, isStale } from "@/lib/situation/format";
import { SITUATION_THRESHOLDS } from "@/lib/situation/thresholds";
import type {
  ManualSituationAlert,
  SituationBundle,
  SituationHeadline,
  SituationStatus,
  SituationStatusLevel,
} from "@/lib/situation/types";

const LEVEL_RANK: Record<SituationStatusLevel, number> = {
  critical: 0,
  warning: 1,
  info: 2,
  unknown: 3,
  normal: 4,
};

const CHIP_PRIORITY: SituationStatus["id"][] = [
  "weather",
  "aqi",
  "strong_wind",
  "fire",
  "security",
  "flood",
  "earthquake",
  "volcano",
  "lightning",
  "heavy_rain",
  "gate",
  "electricity",
  "water_supply",
];

function manualToStatus(alert: ManualSituationAlert): SituationStatus | null {
  if (alert.status !== "active") return null;

  const base = {
    status: alert.severity,
    title: alert.title,
    summary: alert.description,
    detail: alert.description,
    affectedArea: alert.affectedArea,
    updatedAt: alert.startedAt,
    dataOrigin: "manual" as const,
    source: "Ops (manual)",
    actionLabel: alert.actionLabel,
    actionHref: alert.actionHref,
  };

  switch (alert.type) {
    case "flood":
      return {
        id: "flood",
        category: "environment",
        shortLabel: "Genangan",
        icon: "flood",
        chipValue: "Genangan",
        chipHint: alert.severity === "critical" ? "Kritis" : "Waspada",
        ...base,
      };
    case "drainage":
      return {
        id: "drainage",
        category: "environment",
        shortLabel: "Drainase",
        icon: "drainage",
        chipValue: "Drainase",
        chipHint: "Gangguan",
        ...base,
      };
    case "electricity":
      return {
        id: "electricity",
        category: "utility",
        shortLabel: "Listrik",
        icon: "electricity",
        chipValue: "Listrik",
        chipHint: alert.severity === "critical" ? "Padam" : "Gangguan",
        ...base,
      };
    case "water_supply":
      return {
        id: "water_supply",
        category: "utility",
        shortLabel: "Air",
        icon: "water",
        chipValue: "Air",
        chipHint: "Gangguan",
        ...base,
      };
    case "gate":
      return {
        id: "gate",
        category: "access",
        shortLabel: "Gate",
        icon: "gate",
        chipValue: "Gate",
        chipHint: "Perawatan",
        ...base,
      };
    case "road_closure":
    case "fallen_tree":
      return {
        id: "fallen_tree",
        category: "environment",
        shortLabel: "Akses",
        icon: alert.type === "fallen_tree" ? "tree" : "road",
        chipValue: "Akses",
        chipHint: "Terganggu",
        ...base,
      };
    case "security":
      return {
        id: "security",
        category: "access",
        shortLabel: "Keamanan",
        icon: "security",
        chipValue: "Keamanan",
        chipHint: "Waspada",
        ...base,
      };
    case "fire":
    case "smoke":
      return {
        id: alert.type === "smoke" ? "smoke_fire" : "fire",
        category: alert.type === "smoke" ? "environment" : "access",
        shortLabel: alert.type === "smoke" ? "Asap" : "Kebakaran",
        icon: alert.type === "smoke" ? "smoke" : "fire",
        chipValue: alert.type === "smoke" ? "Asap" : "Api",
        chipHint: "Darurat",
        ...base,
      };
    default:
      return null;
  }
}

function buildWeatherStatuses(data: LingkunganSnapshot): SituationStatus[] {
  const out: SituationStatus[] = [];
  const w = data.weather;
  const stale = w
    ? isStale(w.observedAt, SITUATION_THRESHOLDS.staleAfterMs)
    : false;

  if (!w) {
    out.push({
      id: "weather",
      category: "weather",
      title: "Cuaca",
      shortLabel: "Cuaca",
      status: "unknown",
      summary: "Status cuaca belum tersedia",
      detail: data.errors.find((e) => /cuaca/i.test(e)) ?? "Data Open-Meteo gagal dimuat.",
      source: "Open-Meteo",
      icon: "weather",
      dataOrigin: "live",
      chipValue: "—",
      chipHint: "Tidak tersedia",
    });
    out.push({
      id: "heavy_rain",
      category: "weather",
      title: "Hujan lebat",
      shortLabel: "Hujan",
      status: "unknown",
      summary: "Potensi hujan tidak dapat dinilai",
      source: "Open-Meteo",
      icon: "rain",
      dataOrigin: "live",
    });
    out.push({
      id: "lightning",
      category: "weather",
      title: "Petir",
      shortLabel: "Petir",
      status: "unknown",
      summary: "Potensi petir tidak dapat dinilai",
      detail:
        "Tidak ada pelacakan petir akurat — hanya dari kode cuaca bila tersedia.",
      source: "Open-Meteo",
      icon: "lightning",
      dataOrigin: "live",
    });
    out.push({
      id: "strong_wind",
      category: "weather",
      title: "Angin",
      shortLabel: "Angin",
      status: "unknown",
      summary: "Kecepatan angin belum tersedia",
      source: "Open-Meteo",
      icon: "wind",
      dataOrigin: "live",
      chipValue: "—",
      chipHint: "Angin",
    });
    return out;
  }

  const label = weatherLabelId(w.weatherCode);
  const temp = `${Math.round(w.temperatureC)}°C`;
  const windKmh = Math.round(w.windSpeedKmh);

  // Primary weather — always present; elevate only if stale
  out.push({
    id: "weather",
    category: "weather",
    title: "Cuaca",
    shortLabel: "Cuaca",
    status: stale ? "unknown" : "normal",
    summary: stale
      ? `Data cuaca belum diperbarui (${formatRelativeId(w.observedAt) ?? "lama"})`
      : `${temp} · ${label}`,
    detail: `Kelembapan ${w.humidity}% · Terasa ${Math.round(w.feelsLikeC)}°C`,
    source: "Open-Meteo",
    updatedAt: w.observedAt,
    stale,
    icon: "weather",
    dataOrigin: "live",
    chipValue: temp,
    chipHint: label,
  });

  const heavy =
    SITUATION_THRESHOLDS.heavyRainCodes.includes(w.weatherCode) ||
    w.weatherCode === 65;
  out.push({
    id: "heavy_rain",
    category: "weather",
    title: heavy ? "Waspada hujan lebat" : "Hujan lebat",
    shortLabel: "Hujan",
    status: stale ? "unknown" : heavy ? "warning" : "normal",
    summary: heavy
      ? `Kondisi ${label.toLowerCase()} terdeteksi di sekitar cluster.`
      : "Tidak ada indikasi hujan lebat saat ini.",
    detail: heavy
      ? "Jarak pandang dapat berkurang; genangan lokal mungkin muncul di area rendah."
      : undefined,
    impact: heavy
      ? [
          "Jarak pandang berkurang",
          "Potensi genangan di area rendah",
          "Aktivitas luar ruang terganggu",
        ]
      : undefined,
    recommendations: heavy
      ? [
          "Periksa saluran air di sekitar rumah",
          "Hindari area rendah bila genangan mulai muncul",
          "Amankan barang di luar rumah",
        ]
      : undefined,
    source: "Open-Meteo",
    updatedAt: w.observedAt,
    stale,
    icon: "rain",
    dataOrigin: "live",
    chipValue: heavy ? "Hujan" : "Hujan",
    chipHint: heavy ? "Waspada" : "Normal",
  });

  const lightning = SITUATION_THRESHOLDS.lightningCodes.includes(w.weatherCode);
  out.push({
    id: "lightning",
    category: "weather",
    title: lightning ? "Potensi petir" : "Petir",
    shortLabel: "Petir",
    status: stale ? "unknown" : lightning ? "warning" : "normal",
    summary: lightning
      ? `Kode cuaca menunjukkan ${label.toLowerCase()} — potensi petir di sekitar wilayah.`
      : "Tidak ada indikasi petir dari data cuaca saat ini.",
    detail:
      "Bukan pelacakan petir real-time. Hanya diturunkan dari kode cuaca Open-Meteo.",
    recommendations: lightning
      ? [
          "Hindari aktivitas di lapangan terbuka",
          "Jauhkan perangkat elektronik dari stopkontak bila petir dekat",
        ]
      : undefined,
    source: "Open-Meteo",
    updatedAt: w.observedAt,
    stale,
    icon: "lightning",
    dataOrigin: "live",
    chipValue: "Petir",
    chipHint: lightning ? "Waspada" : "Aman",
  });

  const { warningKmh, criticalKmh } = SITUATION_THRESHOLDS.wind;
  let windLevel: SituationStatusLevel = "normal";
  if (stale) windLevel = "unknown";
  else if (windKmh >= criticalKmh) windLevel = "critical";
  else if (windKmh >= warningKmh) windLevel = "warning";

  out.push({
    id: "strong_wind",
    category: "weather",
    title:
      windLevel === "critical" || windLevel === "warning"
        ? "Angin kencang"
        : "Angin",
    shortLabel: "Angin",
    status: windLevel,
    summary:
      windLevel === "unknown"
        ? "Data angin belum diperbarui"
        : windLevel === "normal"
          ? `${windKmh} km/j · Normal`
          : `Kecepatan angin ${windKmh} km/j (ambang waspada ${warningKmh} km/j).`,
    detail: `Ambang: waspada ≥${warningKmh} km/j · kritis ≥${criticalKmh} km/j (lihat lib/situation/thresholds.ts).`,
    recommendations:
      windLevel === "warning" || windLevel === "critical"
        ? [
            "Amankan barang ringan di area luar rumah",
            "Waspadai ranting/pohon di jalur pejalan kaki",
          ]
        : undefined,
    source: "Open-Meteo",
    updatedAt: w.observedAt,
    stale,
    icon: "wind",
    dataOrigin: "live",
    chipValue: `${windKmh} km/j`,
    chipHint:
      windLevel === "normal"
        ? "Normal"
        : windLevel === "unknown"
          ? "Stale"
          : "Kencang",
  });

  return out;
}

function buildAqiStatus(data: LingkunganSnapshot): SituationStatus {
  const aq = data.airQuality;
  if (!aq) {
    return {
      id: "aqi",
      category: "environment",
      title: "Kualitas udara",
      shortLabel: "AQI",
      status: "unknown",
      summary: "Status AQI belum tersedia",
      detail: data.errors.find((e) => /udara/i.test(e)) ?? undefined,
      source: "Open-Meteo Air Quality",
      icon: "aqi",
      dataOrigin: "live",
      chipValue: "AQI —",
      chipHint: "Tidak tersedia",
    };
  }

  const band = usAqiBand(aq.usAqi);
  const stale = isStale(aq.observedAt, SITUATION_THRESHOLDS.staleAfterMs);
  let status: SituationStatusLevel = "normal";
  if (stale) status = "unknown";
  else if (
    band.tone === "unhealthy" ||
    band.tone === "veryUnhealthy" ||
    band.tone === "hazardous"
  ) {
    status = "critical";
  } else if (band.tone === "unhealthySensitive") {
    status = "warning";
  }
  // moderate stays normal in the headline — still shown as "Sedang" on chips

  return {
    id: "aqi",
    category: "environment",
    title:
      status === "critical" || status === "warning"
        ? "Kewaspadaan udara"
        : "Kualitas udara",
    shortLabel: "AQI",
    status,
    summary: stale
      ? `Data AQI belum diperbarui (${formatRelativeId(aq.observedAt) ?? "lama"})`
      : `AQI ${Math.round(aq.usAqi)} · ${band.label}`,
    detail: `PM2.5 ${Math.round(aq.pm25)} · PM10 ${Math.round(aq.pm10)} μg/m³`,
    recommendations:
      status === "warning" || status === "critical"
        ? [
            "Batasi aktivitas luar ruangan, terutama bagi kelompok sensitif",
            "Tutup jendela bila udara terasa mengganggu",
          ]
        : undefined,
    source: "Open-Meteo Air Quality",
    updatedAt: aq.observedAt,
    stale,
    icon: "aqi",
    dataOrigin: "live",
    chipValue: `AQI ${Math.round(aq.usAqi)}`,
    chipHint: band.label,
  };
}

function buildHazardStatuses(data: LingkunganSnapshot): SituationStatus[] {
  const gempa = data.alerts.filter((a) => a.kind === "gempa");
  const gunung = data.alerts.filter((a) => a.kind === "gunung");
  const gempaFailed = data.errors.some((e) => /gempa|bmkg/i.test(e));
  const gunungFailed = data.errors.some((e) => /gunung/i.test(e));

  const topGempa = gempa[0];
  let quakeStatus: SituationStatusLevel = "normal";
  if (gempaFailed && gempa.length === 0) quakeStatus = "unknown";
  else if (topGempa?.severity === "warning") quakeStatus = "critical";
  else if (topGempa?.severity === "watch") quakeStatus = "warning";
  else if (topGempa?.severity === "info") quakeStatus = "info";

  const earthquake: SituationStatus = {
    id: "earthquake",
    category: "weather",
    title: topGempa ? "Gempa terasa" : "Gempa",
    shortLabel: "BMKG",
    status: quakeStatus,
    summary:
      quakeStatus === "unknown"
        ? "Data BMKG sedang tidak tersedia"
        : topGempa
          ? topGempa.title
          : "Tidak ada gempa relevan dalam 72 jam terakhir",
    detail: topGempa?.detail,
    source: topGempa?.sourceName ?? "BMKG",
    updatedAt: topGempa?.occurredAt,
    icon: "earthquake",
    dataOrigin: "live",
    actionLabel: topGempa ? "Sumber BMKG" : undefined,
    actionHref: topGempa?.sourceUrl,
    chipValue: "BMKG",
    chipHint:
      quakeStatus === "normal"
        ? "Aman"
        : quakeStatus === "unknown"
          ? "N/A"
          : topGempa?.levelLabel ?? "Waspada",
  };

  const topGunung = gunung[0];
  let volcStatus: SituationStatusLevel = "normal";
  if (gunungFailed && gunung.length === 0) volcStatus = "unknown";
  else if (topGunung?.severity === "warning") volcStatus = "critical";
  else if (topGunung?.severity === "watch") volcStatus = "warning";

  const volcano: SituationStatus = {
    id: "volcano",
    category: "weather",
    title: topGunung ? "Aktivitas gunung api" : "Gunung api",
    shortLabel: "Gunung",
    status: volcStatus,
    summary:
      volcStatus === "unknown"
        ? "Status gunung api tidak tersedia"
        : topGunung
          ? topGunung.title
          : "Tidak ada status Siaga/Awas pada pantauan relevan",
    detail: topGunung?.detail,
    source: topGunung?.sourceName ?? "MAGMA PVMBG",
    icon: "volcano",
    dataOrigin: "live",
    actionLabel: topGunung ? "Sumber MAGMA" : undefined,
    actionHref: topGunung?.sourceUrl,
    chipValue: "Gunung",
    chipHint:
      volcStatus === "normal"
        ? "Aman"
        : volcStatus === "unknown"
          ? "N/A"
          : topGunung?.levelLabel ?? "Pantau",
  };

  return [earthquake, volcano];
}

function buildManualPlaceholders(
  overrides: Map<string, SituationStatus>,
): SituationStatus[] {
  const defs: Omit<SituationStatus, "status" | "summary">[] = [
    {
      id: "flood",
      category: "environment",
      title: "Genangan",
      shortLabel: "Genangan",
      icon: "flood",
      dataOrigin: "manual",
      source: "Ops (manual)",
      chipValue: "Genangan",
      chipHint: "Normal",
      detail:
        "Sumber sensor belum ada. Status dari laporan Ops bila tersedia.",
    },
    {
      id: "drainage",
      category: "environment",
      title: "Drainase",
      shortLabel: "Drainase",
      icon: "drainage",
      dataOrigin: "manual",
      source: "Ops (manual)",
      chipValue: "Drainase",
      chipHint: "Normal",
    },
    {
      id: "fallen_tree",
      category: "environment",
      title: "Pohon / hambatan jalan",
      shortLabel: "Akses jalan",
      icon: "tree",
      dataOrigin: "manual",
      source: "Ops (manual)",
      chipValue: "Pohon",
      chipHint: "Normal",
    },
    {
      id: "smoke_fire",
      category: "environment",
      title: "Asap / kebakaran sekitar",
      shortLabel: "Asap",
      icon: "smoke",
      dataOrigin: "manual",
      source: "Ops (manual)",
      chipValue: "Asap",
      chipHint: "Normal",
    },
    {
      id: "electricity",
      category: "utility",
      title: "Listrik",
      shortLabel: "Listrik",
      icon: "electricity",
      dataOrigin: "manual",
      source: "Ops (manual)",
      chipValue: "Listrik",
      chipHint: "Normal",
      detail: "Belum terhubung ke API PLN. Dikelola manual oleh Ops.",
    },
    {
      id: "water_supply",
      category: "utility",
      title: "Air bersih",
      shortLabel: "Air",
      icon: "water",
      dataOrigin: "manual",
      source: "Ops (manual)",
      chipValue: "Air",
      chipHint: "Normal",
    },
    {
      id: "gate",
      category: "access",
      title: "Gate / akses",
      shortLabel: "Gate",
      icon: "gate",
      dataOrigin: "manual",
      source: "Ops (manual)",
      chipValue: "Gate",
      chipHint: "Normal",
    },
  ];

  return defs.map((d) => {
    const override = overrides.get(d.id);
    if (override) return override;
    return {
      ...d,
      status: "normal" as const,
      summary: "Tidak ada laporan gangguan saat ini.",
    };
  });
}

function buildEmergencyStatuses(
  incidents: EmergencyIncident[],
): SituationStatus[] {
  const active = incidents.filter((i) => i.status !== "Selesai");
  const fire = active.find((i) => i.kind === "kebakaran");
  const other = active.find((i) => i.kind !== "kebakaran");

  const fireStatus: SituationStatus = fire
    ? {
        id: "fire",
        category: "access",
        title: "Darurat kebakaran",
        shortLabel: "Api",
        status: "critical",
        summary: `Kebakaran dilaporkan · ${fire.reporter_blok}`,
        detail: [
          fire.kode ? `Kode ${fire.kode}` : null,
          `Status: ${fire.status}`,
          fire.note,
        ]
          .filter(Boolean)
          .join(" · "),
        affectedArea: fire.reporter_blok,
        updatedAt: fire.updated_at || fire.created_at,
        icon: "fire",
        dataOrigin: "internal",
        source: "Darurat Nahara",
        actionLabel: "Lihat kejadian",
        actionHref: "/darurat",
        chipValue: "Api",
        chipHint: fire.status,
        recommendations: [
          "Ikuti arahan petugas di lokasi",
          "Jauhkan diri dari area terdampak",
        ],
      }
    : {
        id: "fire",
        category: "access",
        title: "Kebakaran",
        shortLabel: "Api",
        status: "normal",
        summary: "Tidak ada laporan kebakaran aktif.",
        icon: "fire",
        dataOrigin: "internal",
        source: "Darurat Nahara",
        chipValue: "Api",
        chipHint: "Aman",
      };

  let securityStatus: SituationStatus;
  if (other) {
    const kindLabel = EMERGENCY_KIND_LABEL[other.kind] ?? "Insiden";
    securityStatus = {
      id: "security",
      category: "access",
      title: "Informasi keamanan",
      shortLabel: "Keamanan",
      status: other.status === "Terkendali" ? "info" : "warning",
      summary: `Terdapat ${kindLabel.toLowerCase()} yang sedang ditangani.`,
      detail: `Area: ${other.reporter_blok} · Status: ${other.status}`,
      affectedArea: other.reporter_blok,
      updatedAt: other.updated_at || other.created_at,
      icon: "security",
      dataOrigin: "internal",
      source: "Darurat Nahara",
      actionLabel: "Lihat kejadian",
      actionHref: "/darurat",
      chipValue: "Keamanan",
      chipHint: "Waspada",
      recommendations: [
        "Ikuti arahan pengurus / petugas",
        "Hindari area terdampak bila diminta",
      ],
    };
  } else if (fire) {
    securityStatus = {
      id: "security",
      category: "access",
      title: "Keamanan",
      shortLabel: "Keamanan",
      status: "info",
      summary: "Ada kejadian darurat terkait kebakaran — lihat status api.",
      icon: "security",
      dataOrigin: "internal",
      source: "Darurat Nahara",
      chipValue: "Keamanan",
      chipHint: "Pantau",
      actionLabel: "Lihat kejadian",
      actionHref: "/darurat",
    };
  } else {
    securityStatus = {
      id: "security",
      category: "access",
      title: "Keamanan",
      shortLabel: "Keamanan",
      status: "normal",
      summary: "Tidak ada insiden aktif yang dilaporkan.",
      detail:
        "Hanya menampilkan ringkasan tinggi. Detail operasional tidak ditampilkan.",
      icon: "security",
      dataOrigin: "internal",
      source: "Darurat Nahara",
      chipValue: "Keamanan",
      chipHint: "Normal",
    };
  }

  return [fireStatus, securityStatus];
}

function mergeById(list: SituationStatus[]): SituationStatus[] {
  const map = new Map<string, SituationStatus>();
  for (const s of list) {
    const prev = map.get(s.id);
    if (!prev || LEVEL_RANK[s.status] < LEVEL_RANK[prev.status]) {
      map.set(s.id, s);
    }
  }
  return Array.from(map.values());
}

function buildHeadline(statuses: SituationStatus[]): SituationHeadline {
  const liveUnknown = statuses.filter(
    (s) =>
      s.status === "unknown" &&
      (s.dataOrigin === "live" || s.dataOrigin === "internal"),
  );
  const critical = statuses.filter((s) => s.status === "critical");
  const warning = statuses.filter((s) => s.status === "warning");
  const info = statuses.filter((s) => s.status === "info");

  if (critical.length > 0) {
    const top = critical[0]!;
    return {
      level: "critical",
      title: top.title.toUpperCase(),
      detail: top.summary,
    };
  }

  if (warning.length > 0) {
    const top = warning[0]!;
    return {
      level: "warning",
      title: top.title.toUpperCase(),
      detail: top.summary,
    };
  }

  if (liveUnknown.length > 0 && info.length === 0) {
    return {
      level: "unknown",
      title: "SEBAGIAN DATA BELUM TERSEDIA",
      detail: `${liveUnknown.length} status live belum dapat dikonfirmasi. Jangan anggap otomatis aman.`,
    };
  }

  if (info.length > 0) {
    const top = info[0]!;
    return {
      level: "info",
      title: top.title.toUpperCase(),
      detail: top.summary,
    };
  }

  if (liveUnknown.length > 0) {
    return {
      level: "unknown",
      title: "SEBAGIAN DATA BELUM TERSEDIA",
      detail: "Beberapa sumber eksternal sedang tidak tersedia.",
    };
  }

  return {
    level: "normal",
    title: "KONDISI NAHARA NORMAL",
    detail: "Tidak ada peringatan penting saat ini.",
  };
}

function pickChips(statuses: SituationStatus[]): SituationStatus[] {
  const byId = new Map(statuses.map((s) => [s.id, s]));
  const picked: SituationStatus[] = [];
  for (const id of CHIP_PRIORITY) {
    const s = byId.get(id);
    if (!s) continue;
    if (
      s.status !== "normal" ||
      id === "weather" ||
      id === "aqi" ||
      id === "strong_wind" ||
      id === "earthquake" ||
      id === "gate"
    ) {
      picked.push(s);
    }
    if (picked.length >= 5) break;
  }
  return picked.slice(0, 5);
}

export type AggregateSituationInput = {
  lingkungan: LingkunganSnapshot;
  emergencies?: EmergencyIncident[];
  manualAlerts?: ManualSituationAlert[];
};

/**
 * Single aggregation layer: lingkungan + emergency + manual → SituationBundle.
 * UI should consume this — not provider-specific transforms.
 */
export function aggregateSituation(
  input: AggregateSituationInput,
): SituationBundle {
  const manual = input.manualAlerts ?? [];
  const manualStatuses = manual
    .map(manualToStatus)
    .filter((s): s is SituationStatus => s != null);
  const overrideMap = new Map(manualStatuses.map((s) => [s.id, s]));

  const statuses = mergeById([
    ...buildWeatherStatuses(input.lingkungan),
    buildAqiStatus(input.lingkungan),
    ...buildHazardStatuses(input.lingkungan),
    ...buildManualPlaceholders(overrideMap),
    ...buildEmergencyStatuses(input.emergencies ?? []),
    ...manualStatuses,
  ]);

  // Sort: critical → warning → info → unknown → normal, then category
  statuses.sort(
    (a, b) =>
      LEVEL_RANK[a.status] - LEVEL_RANK[b.status] ||
      a.category.localeCompare(b.category) ||
      a.title.localeCompare(b.title),
  );

  const promoted = statuses.filter((s) => s.status !== "normal");
  const normalCount = statuses.filter((s) => s.status === "normal").length;
  const unknownCount = statuses.filter((s) => s.status === "unknown").length;

  return {
    headline: buildHeadline(statuses),
    statuses,
    promoted,
    chips: pickChips(statuses),
    normalCount,
    unknownCount,
    fetchedAt: input.lingkungan.fetchedAt,
  };
}

/** @deprecated Prefer aggregateSituation — kept for older imports */
export function deriveSituation(data: LingkunganSnapshot) {
  const bundle = aggregateSituation({ lingkungan: data });
  return {
    level:
      bundle.headline.level === "critical"
        ? ("emergency" as const)
        : bundle.headline.level === "warning"
          ? ("warning" as const)
          : ("normal" as const),
    title: bundle.headline.title,
    detail: bundle.headline.detail,
  };
}
