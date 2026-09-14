import type { WargaWithIuran } from "../types";
import type { LotPoly } from "./provisional-lots";
import { houseTypeForRow } from "./houseTypes";

// These polygons remain legacy approximations. Preview keys are NOT canonical lot IDs.
export function getHouseStyle(warga?: WargaWithIuran) {
  if (!warga) return { fill: "#94a3b8", stroke: "#64748b" };
  if (warga.status_hunian === "Kosong") return { fill: "#334155", stroke: "#475569" };
  if (warga.status_hunian === "Kontrak") return { fill: "#f59e0b", stroke: "#b45309" };
  if (warga.iuran_lunas) return { fill: "#10b981", stroke: "#047857" };
  return { fill: "#ef4444", stroke: "#b91c1c" };
}

export function statusLabel(warga?: WargaWithIuran) {
  if (!warga) return "Data hunian belum tersedia";
  if (warga.status_hunian === "Kosong") return "Kosong";
  if (warga.status_hunian === "Kontrak") return "Kontrak";
  return warga.iuran_lunas ? "Lunas" : "Belum Bayar";
}

export function approximateType(lot: LotPoly) {
  if (lot.isRC) return null;
  const row = Number(lot.blokKey.match(/(?:BARAT|TIMUR)\s+(\d+)/)?.[1]);
  return houseTypeForRow(row);
}
