"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { KasEntry } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowRightLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/Loading";
import { useAuth } from "@/lib/hooks/useAuth";
import { AdminLoginPrompt } from "@/components/AdminOnly";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";
import { KasToDonasiForm } from "@/components/KasToDonasiForm";
import { parseKasToDonasiCampaignId } from "@/lib/kas-donasi";
import {
  entryDelta,
  monthBounds,
  netKas,
  summarizeKas,
} from "@/lib/kas-summary";

const CATEGORIES = ["Saldo Awal", "Iuran", "Donasi", "Operasional", "Perbaikan", "Lainnya"];

export default function KeuanganPage() {
  const supabase = createClient();
  const { isAdmin } = useAuth();
  const [entries, setEntries] = useState<KasEntry[]>([]);
  const [saldoAwalPeriode, setSaldoAwalPeriode] = useState(0);
  const [saldoAkhir, setSaldoAkhir] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "pemasukan" as "pemasukan" | "pengeluaran",
    amount: "",
    description: "",
    category: "Iuran",
    date: new Date().toISOString().split("T")[0],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    let listQuery = supabase.from("kas_entries").select("*").order("date", { ascending: false });
    if (monthFilter) {
      const { start, end } = monthBounds(monthFilter);
      listQuery = listQuery.gte("date", start).lte("date", end);
    }
    if (categoryFilter) listQuery = listQuery.eq("category", categoryFilter);

    // Kumulatif sampai akhir periode (abaikan filter kategori)
    let akhirQuery = supabase.from("kas_entries").select("type, amount");
    if (monthFilter) {
      const { end } = monthBounds(monthFilter);
      akhirQuery = akhirQuery.lte("date", end);
    }

    const awalPromise = monthFilter
      ? supabase
          .from("kas_entries")
          .select("type, amount")
          .lt("date", monthBounds(monthFilter).start)
      : Promise.resolve({ data: null as { type: string; amount: number }[] | null, error: null });

    const [listRes, akhirRes, awalRes] = await Promise.all([
      listQuery,
      akhirQuery,
      awalPromise,
    ]);

    if (listRes.error) {
      setError(getSupabaseErrorMessage(listRes.error));
      setEntries([]);
      setSaldoAwalPeriode(0);
      setSaldoAkhir(0);
      setLoading(false);
      return;
    }

    setEntries((listRes.data ?? []) as KasEntry[]);
    setSaldoAkhir(netKas((akhirRes.data ?? []) as Pick<KasEntry, "type" | "amount">[]));

    if (monthFilter && awalRes.data) {
      setSaldoAwalPeriode(netKas(awalRes.data as Pick<KasEntry, "type" | "amount">[]));
    } else {
      setSaldoAwalPeriode(0);
    }

    setLoading(false);
  }, [supabase, monthFilter, categoryFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const monthSummary = summarizeKas(entries);
  const totalPemasukan = monthSummary.totalPemasukan;
  const totalPengeluaran = monthSummary.totalPengeluaran;
  const saldoBulanIni = monthSummary.saldoBulanIni;
  /** Bawa-asal bulan sebelumnya + kategori Saldo Awal di periode */
  const saldoAwalTampil = monthFilter
    ? saldoAwalPeriode + monthSummary.saldoAwal
    : monthSummary.saldoAwal;

  let running = saldoAwalPeriode;
  const entriesWithSaldo = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at))
    .map((e) => {
      running += entryDelta(e);
      return { ...e, runningSaldo: running };
    })
    .reverse();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      type: form.type,
      amount: parseInt(form.amount, 10),
      description: form.description,
      category: form.category,
      date: form.date,
    };
    if (editId) {
      await supabase.from("kas_entries").update(payload).eq("id", editId);
    } else {
      await supabase.from("kas_entries").insert(payload);
    }
    setShowForm(false);
    setEditId(null);
    setForm({
      type: "pemasukan",
      amount: "",
      description: "",
      category: "Iuran",
      date: new Date().toISOString().split("T")[0],
    });
    fetchData();
  }

  async function handleDelete(id: string) {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;
    if (!confirm("Hapus transaksi ini?")) return;

    const campaignId = parseKasToDonasiCampaignId(entry.description);
    if (campaignId && entry.type === "pengeluaran") {
      const { data: campaign } = await supabase
        .from("donasi_campaign")
        .select("id, collected_amount")
        .eq("id", campaignId)
        .maybeSingle();
      if (campaign) {
        const next = Math.max(0, (campaign.collected_amount ?? 0) - entry.amount);
        await supabase
          .from("donasi_campaign")
          .update({ collected_amount: next })
          .eq("id", campaignId);
      }
    }

    await supabase.from("kas_entries").delete().eq("id", id);
    fetchData();
  }

  function startEdit(entry: KasEntry) {
    setEditId(entry.id);
    setForm({
      type: entry.type,
      amount: String(entry.amount),
      description: entry.description,
      category: entry.category ?? "Lainnya",
      date: entry.date,
    });
    setShowForm(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Keuangan</h1>
          <p className="mt-1 text-sm text-slate-400">Pencatatan pemasukan dan pengeluaran</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              if (!isAdmin) return;
              setShowTransfer(true);
              setShowForm(false);
              setEditId(null);
            }}
            className="btn-secondary"
            disabled={!isAdmin}
          >
            <ArrowRightLeft className="mr-1.5 h-4 w-4" /> Kas → Donasi
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isAdmin) return;
              setShowForm(true);
              setShowTransfer(false);
              setEditId(null);
            }}
            className="btn-primary"
            disabled={!isAdmin}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Tambah
          </button>
        </div>
      </div>

      {!isAdmin && (
        <div className="glass-card flex items-center justify-between gap-4">
          <p className="text-sm text-slate-400">Login admin untuk menambah atau mengedit transaksi.</p>
          <AdminLoginPrompt message="Login Admin" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {saldoAwalTampil !== 0 && (
          <div className="glass-card">
            <p className="text-xs text-slate-500">Saldo Awal</p>
            <p className="mt-1 font-display text-2xl font-bold text-slate-900">
              {formatCurrency(saldoAwalTampil)}
            </p>
          </div>
        )}
        <div className="glass-card">
          <p className="text-xs text-slate-500">Total Pemasukan</p>
          <p className="mt-1 font-display text-2xl font-bold text-gold-dark">
            {formatCurrency(totalPemasukan)}
          </p>
        </div>
        <div className="glass-card">
          <p className="text-xs text-slate-500">Total Pengeluaran</p>
          <p className="mt-1 font-display text-2xl font-bold text-red-600">
            {formatCurrency(totalPengeluaran)}
          </p>
        </div>
        {monthFilter && (
          <div className="glass-card">
            <p className="text-xs text-slate-500">Saldo Bulan Ini</p>
            <p
              className={`mt-1 font-display text-2xl font-bold ${
                saldoBulanIni < 0 ? "text-red-600" : "text-slate-900"
              }`}
            >
              {formatCurrency(saldoBulanIni)}
            </p>
          </div>
        )}
        <div className="glass-card">
          <p className="text-xs text-slate-500">{monthFilter ? "Saldo Akhir" : "Saldo"}</p>
          <p
            className={`mt-1 font-display text-2xl font-bold ${
              saldoAkhir < 0 ? "text-red-600" : "text-slate-900"
            }`}
          >
            {formatCurrency(saldoAkhir)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="month"
          className="input w-auto"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
        />
        <select
          className="input w-auto"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">Semua Kategori</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {showTransfer && isAdmin && (
        <KasToDonasiForm
          onDone={() => {
            setShowTransfer(false);
            fetchData();
          }}
          onCancel={() => setShowTransfer(false)}
        />
      )}

      {showForm && isAdmin && (
        <form onSubmit={handleSubmit} className="glass-card space-y-4">
          <h3 className="font-semibold text-slate-900">{editId ? "Edit" : "Tambah"} Transaksi</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Tipe</label>
              <select
                className="input"
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as "pemasukan" | "pengeluaran" })
                }
              >
                <option value="pemasukan">Pemasukan</option>
                <option value="pengeluaran">Pengeluaran</option>
              </select>
            </div>
            <div>
              <label className="label">Nominal</label>
              <input
                type="number"
                className="input"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Kategori</label>
              <select
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tanggal</label>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="label">Keterangan</label>
            <input
              className="input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">
              Simpan
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
              Batal
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      ) : entries.length === 0 ? (
        <div className="glass-card space-y-2 text-sm text-slate-600">
          <p className="font-medium text-slate-800">Belum ada transaksi kas.</p>
          <p>Import rekap bendahara dengan menjalankan file SQL di Supabase:</p>
          <code className="block rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
            supabase/seeds/202606_arus_kas_jun2026.sql
            {"\n"}
            supabase/seeds/202607_arus_kas_jul2026.sql
          </code>
          <p className="text-xs text-slate-500">
            Jalankan Juni dulu lalu Juli. Saldo akhir Juli: Rp 14.341.817.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-400">
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Keterangan</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Nominal</th>
                <th className="px-4 py-3">Saldo</th>
                {isAdmin && <th className="px-4 py-3">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {entriesWithSaldo.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-400">{formatDate(entry.date)}</td>
                  <td className="px-4 py-3 text-slate-700">{entry.description}</td>
                  <td className="px-4 py-3 text-slate-400">{entry.category}</td>
                  <td
                    className={`px-4 py-3 font-medium ${
                      entry.type === "pemasukan" ? "text-gold-dark" : "text-red-600"
                    }`}
                  >
                    {entry.type === "pemasukan" ? "+" : "-"}
                    {formatCurrency(entry.amount)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatCurrency(entry.runningSaldo)}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(entry)}
                          className="text-slate-400 hover:text-gold-dark"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(entry.id)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
