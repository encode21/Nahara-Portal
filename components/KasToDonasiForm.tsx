"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DonasiCampaign } from "@/lib/types";
import { AGUSTUSAN_CAMPAIGN_ID } from "@/lib/constants/agustusan";
import { buildKasToDonasiDescription } from "@/lib/kas-donasi";
import { formatCurrency } from "@/lib/utils";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";
import { LoadingSpinner } from "@/components/ui/Loading";

type Props = {
  onDone: () => void;
  onCancel: () => void;
};

export function KasToDonasiForm({ onDone, onCancel }: Props) {
  const supabase = createClient();
  const [campaigns, setCampaigns] = useState<DonasiCampaign[]>([]);
  const [campaignId, setCampaignId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoadingList(true);
      const { data } = await supabase
        .from("donasi_campaign")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      const list = (data ?? []) as DonasiCampaign[];
      setCampaigns(list);
      const preferred =
        list.find((c) => c.id === AGUSTUSAN_CAMPAIGN_ID)?.id ?? list[0]?.id ?? "";
      setCampaignId(preferred);
      setLoadingList(false);
    }
    load();
  }, [supabase]);

  const selected = campaigns.find((c) => c.id === campaignId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const nominal = parseInt(amount, 10);
    if (!campaignId || !selected) {
      setError("Pilih campaign donasi.");
      return;
    }
    if (!Number.isFinite(nominal) || nominal <= 0) {
      setError("Nominal tidak valid.");
      return;
    }

    setSaving(true);

    const description = buildKasToDonasiDescription(
      selected.id,
      selected.judul,
      note
    );

    const { data: inserted, error: kasError } = await supabase
      .from("kas_entries")
      .insert({
        type: "pengeluaran",
        amount: nominal,
        description,
        category: "Donasi",
        date,
      })
      .select("id")
      .single();

    if (kasError || !inserted) {
      setSaving(false);
      setError(getSupabaseErrorMessage(kasError) ?? "Gagal mencatat pengeluaran kas.");
      return;
    }

    const { data: fresh, error: readError } = await supabase
      .from("donasi_campaign")
      .select("collected_amount")
      .eq("id", selected.id)
      .single();

    if (readError || !fresh) {
      await supabase.from("kas_entries").delete().eq("id", inserted.id);
      setSaving(false);
      setError("Gagal membaca campaign. Pengeluaran kas dibatalkan.");
      return;
    }

    const { error: donasiError } = await supabase
      .from("donasi_campaign")
      .update({ collected_amount: (fresh.collected_amount ?? 0) + nominal })
      .eq("id", selected.id);

    if (donasiError) {
      await supabase.from("kas_entries").delete().eq("id", inserted.id);
      setSaving(false);
      setError(
        getSupabaseErrorMessage(donasiError) ??
          "Gagal menaikkan dana donasi. Pengeluaran kas dibatalkan."
      );
      return;
    }

    setSaving(false);
    onDone();
  }

  if (loadingList) {
    return (
      <div className="glass-card flex justify-center py-8">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="glass-card space-y-3">
        <h3 className="font-semibold text-slate-900">Transfer kas → donasi</h3>
        <p className="text-sm text-slate-600">
          Belum ada campaign donasi aktif. Buat dulu di menu Donasi.
        </p>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Tutup
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card space-y-4">
      <div>
        <h3 className="font-semibold text-slate-900">Transfer kas → donasi</h3>
        <p className="mt-1 text-sm text-slate-500">
          Satu aksi: pengeluaran di Keuangan + dana terkumpul campaign naik.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="kas-donasi-campaign">
            Campaign donasi
          </label>
          <select
            id="kas-donasi-campaign"
            className="input"
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            required
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.judul} — terkumpul {formatCurrency(c.collected_amount)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="kas-donasi-amount">
            Nominal (Rp)
          </label>
          <input
            id="kas-donasi-amount"
            type="number"
            min="1"
            className="input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="kas-donasi-date">
            Tanggal
          </label>
          <input
            id="kas-donasi-date"
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="kas-donasi-note">
            Catatan (opsional)
          </label>
          <input
            id="kas-donasi-note"
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Contoh: subsidi panitia dari kas Nahara"
          />
        </div>
      </div>

      {selected && amount && parseInt(amount, 10) > 0 && (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Setelah simpan: kas −{formatCurrency(parseInt(amount, 10))}, donasi &quot;
          {selected.judul}&quot; →{" "}
          {formatCurrency(selected.collected_amount + parseInt(amount, 10))}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? <LoadingSpinner /> : "Transfer"}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>
          Batal
        </button>
      </div>
    </form>
  );
}
