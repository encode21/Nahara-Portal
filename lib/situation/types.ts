/**
 * Nahara Situation Center — normalized resident-facing status model.
 *
 * dataOrigin labels:
 * - live: external API (Open-Meteo, BMKG, MAGMA)
 * - internal: existing app data (e.g. emergency_incidents)
 * - manual: ops/admin-managed (prepared; no table yet unless noted)
 * - future: UI/type placeholder until a source exists
 */

export type SituationStatusLevel =
  | "normal"
  | "info"
  | "warning"
  | "critical"
  | "unknown";

export type SituationCategory =
  | "weather"
  | "environment"
  | "utility"
  | "access";

export type SituationDataOrigin = "live" | "internal" | "manual" | "future";

export type SituationIconKey =
  | "weather"
  | "aqi"
  | "wind"
  | "lightning"
  | "rain"
  | "flood"
  | "drainage"
  | "tree"
  | "electricity"
  | "water"
  | "gate"
  | "security"
  | "fire"
  | "earthquake"
  | "volcano"
  | "road"
  | "smoke";

export type SituationStatusId =
  | "weather"
  | "heavy_rain"
  | "lightning"
  | "strong_wind"
  | "earthquake"
  | "volcano"
  | "aqi"
  | "flood"
  | "drainage"
  | "fallen_tree"
  | "smoke_fire"
  | "electricity"
  | "water_supply"
  | "gate"
  | "security"
  | "fire";

export type SituationStatus = {
  id: SituationStatusId;
  category: SituationCategory;
  title: string;
  shortLabel: string;
  status: SituationStatusLevel;
  summary: string;
  detail?: string;
  impact?: string[];
  recommendations?: string[];
  source?: string;
  updatedAt?: string;
  /** True when external observation is older than staleness threshold */
  stale?: boolean;
  icon: SituationIconKey;
  actionLabel?: string;
  actionHref?: string;
  dataOrigin: SituationDataOrigin;
  /** Compact chip primary value, e.g. "27°C" or "AQI 62" */
  chipValue?: string;
  /** Compact chip secondary, e.g. "Berawan" */
  chipHint?: string;
  affectedArea?: string;
};

export type SituationHeadlineLevel =
  | "normal"
  | "info"
  | "warning"
  | "critical"
  | "unknown";

export type SituationHeadline = {
  level: SituationHeadlineLevel;
  title: string;
  detail: string;
};

/**
 * Manual / ops-managed alert shape (future table).
 * Do not invent sensor readings — only use when Ops provides rows.
 */
export type ManualSituationAlert = {
  id: string;
  type:
    | "flood"
    | "drainage"
    | "electricity"
    | "water_supply"
    | "gate"
    | "road_closure"
    | "fallen_tree"
    | "security"
    | "fire"
    | "smoke";
  severity: Exclude<SituationStatusLevel, "unknown">;
  title: string;
  description: string;
  affectedArea?: string;
  startedAt?: string;
  resolvedAt?: string | null;
  status: "active" | "resolved";
  createdBy?: string;
  actionLabel?: string;
  actionHref?: string;
};

export type SituationBundle = {
  headline: SituationHeadline;
  statuses: SituationStatus[];
  /** Statuses that should expand as alert cards (not normal) */
  promoted: SituationStatus[];
  /** Compact chips for the calm strip */
  chips: SituationStatus[];
  normalCount: number;
  unknownCount: number;
  fetchedAt: string;
};
