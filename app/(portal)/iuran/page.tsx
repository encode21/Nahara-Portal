"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Iuran, Warga } from "@/lib/types";
import {
  formatCurrency,
  formatMonthShort,
  getCurrentYearMonth,
  getPrepaidCoverage,
  normalizeMonthDate,
} from "@/lib/utils";
import { StatusBadge, getIuranVariant } from "@/components/ui/StatusBadge";
import { BLOK_ROWS } from "@/lib/constants/cluster-layout";
import { LoadingSpinner } from "@/components/ui/Loading";
import { useAuth } from "@/lib/hooks/useAuth";
import { AdminLoginPrompt } from "@/components/AdminOnly";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";
import { RefreshCw } from "lucide-react";

const MONTHLY_RATE = 50000;

type IuranRow = {
  warga: Warga;
  iuran: Iuran | null;
  coverage: ReturnType<typeof getPrepaidCoverage>;
};

export default function IuranPage() {
  const supabase = createClient();
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<IuranRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulan, setBulan] = useState(getCurrentYearMonth());
  const [blokFilter, setBlokFilter] = useState("");

  const bulanDate = `${bulan}-01`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [y] = bulan.split("-").map(Number);
    const yearStart = `${y}-01-01`;
    const yearEnd = `${y + 1}-12-01`;

    const [wargaRes, iuranRes, historyRes] = await Promise.all([
      supabase.from("warga").select("*").order("blok"),
      supabase.from("iuran").select("*").eq("bulan", bulanDate),
      supabase
        .from("iuran")
        .select("warga_id, bulan, status, nominal")
        .eq("status", true)
        .gte("bulan", yearStart)
        .lte("bulan", yearEnd),
    ]);

    if (wargaRes.error) {
      setError(getSupabaseErrorMessage(wargaRes.error));
      setLoading(false);
      return;
    }

    const wargaList = (wargaRes.data ?? []) as Warga[];
    const iuranList = (iuranRes.data ?? []) as Iuran[];
    const history = (historyRes.data ?? []) as Pick<
      Iuran,
      "warga_id" | "bulan" | "status" | "nominal"
    >[];

    const iuranByWarga = new Map(
      iuranList.map((i) => [i.warga_id, i] as const),
    );
    const paidByWarga = new Map<string, string[]>();
    for (const row of history) {
      const list = paidByWarga.get(row.warga_id) ?? [];
      list.push(row.bulan);
      paidByWarga.set(row.warga_id, list);
    }

    let merged: IuranRow[] = wargaList.map((w) => {
      const iuran = iuranByWarga.get(w.id) ?? null;
      const coverage =
        iuran?.status
          ? getPrepaidCoverage(paidByWarga.get(w.id) ?? [], bulanDate, MONTHLY_RATE)
          : null;
      return { warga: w, iuran, coverage };
    });

    if (blokFilter) {
      merged = merged.filter((r) => r.warga.blok_row === blokFilter);
    }

    setRows(merged);
    setLoading(false);
  }, [supabase, bulan, bulanDate, blokFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function generateIuran() {
    if (!isAdmin) return;
    setGenerating(true);
    setError(null);

    const { data: wargaList, error: wargaError } = await supabase
      .from("warga")
      .select("id");
    if (wargaError) {
      setError(getSupabaseErrorMessage(wargaError));
      setGenerating(false);
      return;
    }

    if (!wargaList?.length) {
      setError("Belum ada data warga. Tambahkan warga di Info Warga terlebih dahulu.");
      setGenerating(false);
      return;
    }

    const payload = wargaList.map((w) => ({
      warga_id: w.id,
      bulan: bulanDate,
      nominal: MONTHLY_RATE,
      status: false,
    }));

    const { error: upsertError } = await supabase
      .from("iuran")
      .upsert(payload, { onConflict: "warga_id,bulan", ignoreDuplicates: true });

    if (upsertError) {
      setError(getSupabaseErrorMessage(upsertError));
    } else {
      await fetchData();
    }
    setGenerating(false);
  }

  async function toggleStatus(row: IuranRow) {
    if (!isAdmin) return;
    setError(null);

    if (row.iuran) {
      const newStatus = !row.iuran.status;
      const { error: updateError } = await supabase
        .from("iuran")
        .update({
          status: newStatus,
          paid_at: newStatus ? new Date().toISOString() : null,
        })
        .eq("id", row.iuran.id);

      if (updateError) setError(getSupabaseErrorMessage(updateError));
    } else {
      const { error: insertError } = await supabase.from("iuran").insert({
        warga_id: row.warga.id,
        bulan: bulanDate,
        nominal: MONTHLY_RATE,
        status: true,
        paid_at: new Date().toISOString(),
      });

      if (insertError) setError(getSupabaseErrorMessage(insertError));
    }

    await fetchData();
  }

  const lunasRows = rows.filter((r) => r.iuran?.status);
  const totalTerkumpul = lunasRows.reduce((s, r) => {
    // Hitung sekali per periode bayar: ambil total hanya di bulan awal periode
    if (r.coverage && normalizeMonthDate(r.coverage.start) === bulanDate) {
      return s + r.coverage.total;
    }
    if (r.coverage && r.coverage.months > 1) return s;
    return s + (r.iuran?.nominal ?? MONTHLY_RATE);
  }, 0);
  const pctLunas =
    rows.length > 0 ? Math.round((lunasRows.length / rows.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Iuran</h1>
          <p className="mt-1 text-sm text-slate-500">
            Status iuran bulanan (Rp {MONTHLY_RATE.toLocaleString("id-ID")}/bulan). Bayar multi-bulan dicatat penuh.
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={generateIuran}
            disabled={generating}
            className="btn-secondary"
          >
            <RefreshCw className={`mr-1.5 h-4 w-4 ${generating ? "animate-spin" : ""}`} />
            Generate Iuran Bulan Ini
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="glass-card">
          <p className="text-xs text-slate-500">Total Terkumpul (pembayaran di bulan ini)</p>
          <p className="mt-1 font-display text-2xl font-bold text-gold-dark">
            {formatCurrency(totalTerkumpul)}
          </p>
        </div>
        <div className="glass-card">
          <p className="text-xs text-slate-500">Persentase Lunas bulan ini</p>
          <p className="mt-1 font-display text-2xl font-bold text-slate-900">{pctLunas}%</p>
        </div>
      </div>

      {!isAdmin && (
        <div className="glass-card flex items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            Login admin untuk mengubah status pembayaran iuran.
          </p>
          <AdminLoginPrompt message="Login Admin" />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <input
          type="month"
          className="input w-auto"
          value={bulan}
          onChange={(e) => setBulan(e.target.value)}
        />
        <select
          className="input w-auto"
          value={blokFilter}
          onChange={(e) => setBlokFilter(e.target.value)}
        >
          <option value="">Semua Blok</option>
          {BLOK_ROWS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      ) : rows.length === 0 ? (
        <div className="glass-card text-center text-sm text-slate-500">
          Belum ada data warga. Tambahkan warga di Info Warga, lalu klik Generate Iuran.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Blok</th>
                <th className="px-4 py-3">Iuran / Periode</th>
                <th className="px-4 py-3">Status</th>
                {isAdmin && <th className="px-4 py-3">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const paid = row.iuran?.status ?? false;
                const coverage = row.coverage;
                return (
                  <tr
                    key={row.warga.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 text-slate-800">{row.warga.nama}</td>
                    <td className="px-4 py-3 text-slate-500">{row.warga.blok}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <p>{formatCurrency(MONTHLY_RATE)} / bulan</p>
                      {paid && coverage && coverage.months > 1 && (
                        <p className="mt-0.5 text-xs text-gold-dark">
                          Bayar {coverage.months} bulan (
                          {formatMonthShort(coverage.start)} –{" "}
                          {formatMonthShort(coverage.end)}) · total{" "}
                          {formatCurrency(coverage.total)}
                        </p>
                      )}
                      {paid && coverage && coverage.months === 1 && (
                        <p className="mt-0.5 text-xs text-slate-400">1 bulan</p>
                      )}
                      {!paid && !row.iuran && (
                        <p className="mt-0.5 text-xs text-slate-400">Belum ada catatan</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={paid ? "Lunas" : "Belum Bayar"}
                        variant={getIuranVariant(paid)}
                      />
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleStatus(row)}
                          className="text-xs text-gold-dark hover:underline"
                        >
                          {paid ? "Batalkan" : "Tandai Lunas"}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
