"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { KasEntry } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { KasTable } from "@/components/KasTable";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState, LoadingSpinner } from "@/components/ui/Loading";
import { KasFormModal } from "@/components/KasFormModal";
import { KasToDonasiForm } from "@/components/KasToDonasiForm";
import { parseKasToDonasiCampaignId } from "@/lib/kas-donasi";

export default function KasPage() {
  const supabase = createClient();
  const [entries, setEntries] = useState<KasEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase
      .from("kas_entries")
      .select("*")
      .order("date", { ascending: false });

    setEntries((data ?? []) as KasEntry[]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPemasukan = entries
    .filter((e) => e.type === "pemasukan")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalPengeluaran = entries
    .filter((e) => e.type === "pengeluaran")
    .reduce((sum, e) => sum + e.amount, 0);
  const saldo = totalPemasukan - totalPengeluaran;

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
    loadData();
  }

  function handleFormClose() {
    setShowForm(false);
    loadData();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kas Komunitas</h1>
          <p className="mt-1 text-slate-500">Catat pemasukan dan pengeluaran</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setShowTransfer(true);
              setShowForm(false);
            }}
          >
            Kas → Donasi
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setShowForm(true);
              setShowTransfer(false);
            }}
          >
            + Tambah Transaksi
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Pemasukan"
          value={formatCurrency(totalPemasukan)}
          variant="success"
        />
        <StatCard
          label="Total Pengeluaran"
          value={formatCurrency(totalPengeluaran)}
          variant="danger"
        />
        <StatCard label="Saldo" value={formatCurrency(saldo)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          title="Belum ada transaksi"
          description="Mulai catat pemasukan dan pengeluaran kas."
          action={
            <button type="button" className="btn-primary" onClick={() => setShowForm(true)}>
              Tambah Transaksi
            </button>
          }
        />
      ) : (
        <KasTable entries={entries} onDelete={handleDelete} />
      )}

      {showTransfer && (
        <KasToDonasiForm
          onDone={() => {
            setShowTransfer(false);
            loadData();
          }}
          onCancel={() => setShowTransfer(false)}
        />
      )}

      {showForm && <KasFormModal entry={null} onClose={handleFormClose} />}
    </div>
  );
}
