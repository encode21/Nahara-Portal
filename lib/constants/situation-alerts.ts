import type { ManualSituationAlert } from "@/lib/situation/types";

export type SituationAlertType = ManualSituationAlert["type"];
export type SituationAlertSeverity = ManualSituationAlert["severity"];

export const SITUATION_ALERT_TYPES: {
  id: SituationAlertType;
  label: string;
  group: string;
}[] = [
  { id: "smoke", label: "Asap / kebakaran sekitar", group: "Lingkungan" },
  { id: "flood", label: "Genangan", group: "Lingkungan" },
  { id: "drainage", label: "Drainase", group: "Lingkungan" },
  { id: "fallen_tree", label: "Pohon / hambatan jalan", group: "Lingkungan" },
  { id: "road_closure", label: "Akses jalan tertutup", group: "Lingkungan" },
  { id: "electricity", label: "Listrik", group: "Utilitas" },
  { id: "water_supply", label: "Air bersih", group: "Utilitas" },
  { id: "gate", label: "Gate / akses", group: "Akses & keamanan" },
  { id: "security", label: "Keamanan", group: "Akses & keamanan" },
  { id: "fire", label: "Kebakaran", group: "Akses & keamanan" },
];

export const SITUATION_ALERT_SEVERITIES: {
  id: SituationAlertSeverity;
  label: string;
}[] = [
  { id: "info", label: "Info" },
  { id: "warning", label: "Waspada" },
  { id: "critical", label: "Kritis" },
];

export function situationAlertTypeLabel(type: string): string {
  return SITUATION_ALERT_TYPES.find((t) => t.id === type)?.label ?? type;
}

export function situationAlertSeverityLabel(severity: string): string {
  return (
    SITUATION_ALERT_SEVERITIES.find((s) => s.id === severity)?.label ?? severity
  );
}
