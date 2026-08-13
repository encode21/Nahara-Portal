import { SITEPLAN_LOT_MAP } from "@/lib/constants/siteplan-lot-map";
import { PEAK_BLOK_ROWS, formatHouseholdLabel } from "@/lib/constants/agustusan";

export function getPeakLotNumbers(blokRow: string): number[] {
  const map = SITEPLAN_LOT_MAP[blokRow];
  if (!map) return [];
  const set = new Set<number>([...map.atas, ...map.bawah]);
  return Array.from(set).sort((a, b) => a - b);
}

export { PEAK_BLOK_ROWS, formatHouseholdLabel };
