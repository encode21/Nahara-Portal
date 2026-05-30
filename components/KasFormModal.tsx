"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { KasEntry } from "@/lib/types";
import { LoadingSpinner } from "@/components/ui/Loading";

type Props = {
  entry: KasEntry | null;
  onClose: () => void;
};

export function KasFormModal({ entry, onClose }: Props) {
  const supabase = createClient();
  const isEdit = !!entry;

  const [type, setType] = useState<"pemasukan" | "pengeluaran">(
    entry?.type ?? "pemasukan"
  );
  const [amount, setAmount] = useState(entry?.amount?.toString() ?? "");
  const [description, setDescription] = useState(entry?.description ?? "");
  const [category, setCategory] = useState(entry?.category ?? "");
  const [date, setDate] = useState(
    entry?.date ?? new Date().toISOString().slice(0, 10)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      type,
      amount: parseInt(amount, 10),
      description: description.trim(),
      category: category.trim() || null,
      date,
    };

    if (!payload.description || !payload.amount || payload.amount <= 0) {
      setError("Isi deskripsi dan jumlah yang valid.");
      setLoading(false);
      return;
    }

    const result = isEdit
      ? await supabase.from("kas_entries").update(payload).eq("id", entry!.id)
      : await supabase.from("kas_entries").insert(payload);

    setLoading(false);

    if (result.error) {
      setError("Gagal menyimpan transaksi.");
      return;
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? "Edit Transaksi" : "Tambah Transaksi"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="label">Tipe</label>
            <div className="flex gap-3">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="pemasukan"
                  checked={type === "pemasukan"}
                  onChange={() => setType("pemasukan")}
                  className="text-accent focus:ring-accent"
                />
                <span className="text-sm text-slate-700">Pemasukan</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="pengeluaran"
                  checked={type === "pengeluaran"}
                  onChange={() => setType("pengeluaran")}
                  className="text-accent focus:ring-accent"
                />
                <span className="text-sm text-slate-700">Pengeluaran</span>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="amount" className="label">Jumlah (Rp)</label>
            <input
              id="amount"
              type="number"
              min="1"
              className="input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="label">Deskripsi</label>
            <input
              id="description"
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="label">Kategori</label>
            <input
              id="category"
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Contoh: Iuran, Operasional"
            />
          </div>

          <div>
            <label htmlFor="date" className="label">Tanggal</label>
            <input
              id="date"
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? <LoadingSpinner /> : isEdit ? "Simpan" : "Tambah"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
