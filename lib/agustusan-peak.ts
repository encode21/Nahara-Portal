import { PEAK_BLOK_ROWS, formatHouseholdLabel } from "@/lib/constants/agustusan";

/** Anon cannot SELECT phone; keep public queries aligned with column grants. */
export const PEAK_REGISTRATION_PUBLIC_COLUMNS =
  "id, edition_id, blok_row, nomor_kavling, household_label, participant_name, participant_role, twibbon_url, terms_accepted_at, status, registration_code, warga_id, verified_at, cancelled_at, created_at, updated_at";

/** Dropdown daftar malam puncak: peserta pilih nomor 01–56. */
export const PEAK_LOT_MAX = 56;

export function getPeakLotNumbers(_blokRow?: string): number[] {
  return Array.from({ length: PEAK_LOT_MAX }, (_, i) => i + 1);
}

export { PEAK_BLOK_ROWS, formatHouseholdLabel };
