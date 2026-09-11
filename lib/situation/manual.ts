import type { ManualSituationAlert } from "@/lib/situation/types";

/**
 * Ops-managed manual situation alerts.
 *
 * FUTURE: read from a `situation_alerts` (or equivalent) table managed on
 * ops.nahara.id. Until then this always returns [].
 *
 * Do NOT invent flood/electricity/gate sensor data here.
 */
export function getManualSituationAlerts(): ManualSituationAlert[] {
  return [];
}
