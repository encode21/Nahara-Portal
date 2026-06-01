/**
 * Koreksi manual per kavling — merge di atas SITEPLAN_UNIT_RECTS (lihat getAllLotRects).
 *
 * Langkah perbaikan:
 * 1. Buka dashboard dengan ?calibrate=1 — klik sudut kiri-atas kavling → dapat x,y.
 * 2. Salin w,h dari siteplan-unit-rects.ts untuk unit yang sama (atau ukur dari klik kedua).
 * 3. Tambahkan entri di bawah; hanya field yang diisi yang menimpa.
 *
 * Contoh geser satu unit:
 *   "NHB-2/15": { x: 200, y: 890, w: 32, h: 72 },
 *
 * Contoh geser hanya posisi vertikal (w,h tetap dari auto):
 *   "NHB-3/21": { y: 720 },
 */
import type { UnitRect } from "./siteplan-unit-rects";

export const SITEPLAN_UNIT_OVERRIDES: Record<string, Partial<UnitRect>> = {
  // Unit yang sudah benar: jangan diisi. Hanya yang meleset.
};
