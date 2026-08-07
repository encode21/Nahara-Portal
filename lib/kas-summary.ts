import type { KasEntry } from "@/lib/types";

/** Opening balance recorded as pemasukan — not counted in Total Masuk. */
export function isSaldoAwalEntry(
  entry: Pick<KasEntry, "type" | "category">
): boolean {
  return entry.type === "pemasukan" && entry.category === "Saldo Awal";
}

export function summarizeKas(entries: Pick<KasEntry, "type" | "amount" | "category">[]) {
  let saldoAwal = 0;
  let totalPemasukan = 0;
  let totalPengeluaran = 0;

  for (const e of entries) {
    if (e.type === "pengeluaran") {
      totalPengeluaran += e.amount;
      continue;
    }
    if (isSaldoAwalEntry(e)) {
      saldoAwal += e.amount;
    } else {
      totalPemasukan += e.amount;
    }
  }

  return {
    saldoAwal,
    totalPemasukan,
    totalPengeluaran,
    /** Closing balance including Saldo Awal */
    saldo: saldoAwal + totalPemasukan - totalPengeluaran,
  };
}
