"use client";

import { KasEntry } from "@/lib/types";
import { formatCurrency, formatShortDate } from "@/lib/utils";

type Props = {
  entries: KasEntry[];
  onDelete?: (id: string) => void;
};

export function KasTable({ entries, onDelete }: Props) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
        Belum ada transaksi kas.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 font-medium text-slate-600">Tanggal</th>
              <th className="px-4 py-3 font-medium text-slate-600">Tipe</th>
              <th className="px-4 py-3 font-medium text-slate-600">Kategori</th>
              <th className="px-4 py-3 font-medium text-slate-600">Deskripsi</th>
              <th className="px-4 py-3 font-medium text-slate-600 text-right">Jumlah</th>
              {onDelete && <th className="px-4 py-3 font-medium text-slate-600" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 text-slate-600">
                  {formatShortDate(entry.date)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      entry.type === "pemasukan"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {entry.type === "pemasukan" ? "Pemasukan" : "Pengeluaran"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {entry.category ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-900">{entry.description}</td>
                <td
                  className={`px-4 py-3 text-right font-medium ${
                    entry.type === "pemasukan" ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {entry.type === "pemasukan" ? "+" : "−"}
                  {formatCurrency(entry.amount)}
                </td>
                {onDelete && (
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onDelete(entry.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Hapus
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
