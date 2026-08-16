import { PEAK_BLOK_ROWS, formatHouseholdLabel } from "@/lib/constants/agustusan";

/** Dropdown daftar malam puncak: peserta pilih nomor 01–56. */
export const PEAK_LOT_MAX = 56;

export function getPeakLotNumbers(_blokRow?: string): number[] {
  return Array.from({ length: PEAK_LOT_MAX }, (_, i) => i + 1);
}

export { PEAK_BLOK_ROWS, formatHouseholdLabel };
