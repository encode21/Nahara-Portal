import type { Warga } from "@/lib/types";
import { SITEPLAN_ROWS } from "@/lib/constants/cluster-layout";

/** Baris jalan yang ada di cluster — tanpa row 4 & 5. */
export const ACTIVE_BLOK_ROW_NUMS = new Set([1, 2, 3, 6, 7, 8]);

export type BlokHunianSummary = {
  blokRow: string;
  side: "NHT" | "NHB";
  rowNum: number;
  /** Kavling di siteplan */
  units: number;
  /** Semua entri registry di blok ini */
  terdaftar: number;
  /** Status Tetap + Kontrak */
  tinggal: number;
  /** Status Kosong */
  kosong: number;
};

export function buildBlokHunianSummary(
  wargaList: Pick<Warga, "blok_row" | "status_hunian">[],
): BlokHunianSummary[] {
  const byRow = new Map<
    string,
    { terdaftar: number; tinggal: number; kosong: number }
  >();

  for (const w of wargaList) {
    const key = w.blok_row;
    if (!key) continue;
    const cur = byRow.get(key) ?? { terdaftar: 0, tinggal: 0, kosong: 0 };
    cur.terdaftar += 1;
    if (w.status_hunian === "Kosong") cur.kosong += 1;
    else cur.tinggal += 1;
    byRow.set(key, cur);
  }

  return SITEPLAN_ROWS.filter((row) => ACTIVE_BLOK_ROW_NUMS.has(row.rowNum))
    .map((row) => {
      const stats = byRow.get(row.id) ?? {
        terdaftar: 0,
        tinggal: 0,
        kosong: 0,
      };
      return {
        blokRow: row.id,
        side: row.side,
        rowNum: row.rowNum,
        units: row.units,
        ...stats,
      };
    })
    .sort((a, b) => {
      if (a.side !== b.side) return a.side === "NHT" ? -1 : 1;
      return a.rowNum - b.rowNum;
    });
}
