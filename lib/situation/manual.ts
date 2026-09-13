import { createClient } from "@/lib/supabase/server";
import type {
  ManualSituationAlert,
  SituationAlertRow,
} from "@/lib/situation/types";

export type { SituationAlertRow };

const ALERT_TYPES = new Set<ManualSituationAlert["type"]>([
  "flood",
  "drainage",
  "electricity",
  "water_supply",
  "gate",
  "road_closure",
  "fallen_tree",
  "security",
  "fire",
  "smoke",
]);

function isAlertType(v: string): v is ManualSituationAlert["type"] {
  return ALERT_TYPES.has(v as ManualSituationAlert["type"]);
}

export function rowToManualAlert(row: SituationAlertRow): ManualSituationAlert {
  return {
    id: row.id,
    type: row.type,
    severity: row.severity,
    title: row.title,
    description: row.description,
    affectedArea: row.affected_area ?? undefined,
    startedAt: row.started_at,
    resolvedAt: row.resolved_at,
    status: row.status,
    createdBy: row.created_by ?? undefined,
  };
}

/**
 * Ops-managed manual situation alerts from `situation_alerts`.
 * Do NOT invent flood/electricity/gate sensor data here.
 */
export async function getManualSituationAlerts(): Promise<
  ManualSituationAlert[]
> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("situation_alerts")
    .select(
      "id, type, severity, title, description, affected_area, status, started_at, resolved_at, created_by, created_at, updated_at",
    )
    .eq("status", "active")
    .order("started_at", { ascending: false });

  if (error || !data) return [];

  return (data as SituationAlertRow[])
    .filter((row) => isAlertType(row.type))
    .map(rowToManualAlert);
}
