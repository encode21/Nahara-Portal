import type { KasEntry } from "@/lib/types";

/** Opening balance recorded as pemasukan — not counted in Total Masuk. */
export function isSaldoAwalEntry(
  entry: Pick<KasEntry, "type" | "category">
): boolean {
  return entry.type === "pemasukan" && entry.category === "Saldo Awal";
}

export function entryDelta(
  entry: Pick<KasEntry, "type" | "amount">
): number {
  return entry.type === "pemasukan" ? entry.amount : -entry.amount;
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
    /** Net mutasi periode (tanpa Saldo Awal) */
    saldoBulanIni: totalPemasukan - totalPengeluaran,
    /** Closing of listed rows including Saldo Awal category */
    saldo: saldoAwal + totalPemasukan - totalPengeluaran,
  };
}

export function netKas(
  entries: Pick<KasEntry, "type" | "amount">[]
): number {
  return entries.reduce((s, e) => s + entryDelta(e), 0);
}

export function monthBounds(monthYm: string): { start: string; end: string } {
  const [y, m] = monthYm.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return {
    start: `${monthYm}-01`,
    end: `${monthYm}-${String(lastDay).padStart(2, "0")}`,
  };
}
