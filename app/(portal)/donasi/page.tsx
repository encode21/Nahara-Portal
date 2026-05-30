"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DonasiCampaign } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/Loading";
import { useAuth } from "@/lib/hooks/useAuth";
import { AdminLoginPrompt } from "@/components/AdminOnly";

import { getSupabaseErrorMessage } from "@/lib/supabase/errors";

export default function DonasiPage() {
  const supabase = createClient();
  const { isAdmin } = useAuth();
  const [campaigns, setCampaigns] = useState<DonasiCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    judul: "",
    deskripsi: "",
    target_amount: "",
    collected_amount: "0",
    deadline: "",
    is_active: true,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("donasi_campaign").select("*").order("created_at", { ascending: false });
    setCampaigns((data ?? []) as DonasiCampaign[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      judul: form.judul,
      deskripsi: form.deskripsi || null,
      target_amount: parseInt(form.target_amount, 10),
      collected_amount: parseInt(form.collected_amount, 10) || 0,
      deadline: form.deadline || null,
      is_active: form.is_active,
    };
    const result = editId
      ? await supabase.from("donasi_campaign").update(payload).eq("id", editId)
      : await supabase.from("donasi_campaign").insert(payload);

    const err = getSupabaseErrorMessage(result.error);
    if (err) {
      setError(err);
      return;
    }
    setShowForm(false);
    setEditId(null);
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus campaign ini?")) return;
    await supabase.from("donasi_campaign").delete().eq("id", id);
    fetchData();
  }

  function startEdit(c: DonasiCampaign) {
    setEditId(c.id);
    setForm({
      judul: c.judul,
      deskripsi: c.deskripsi ?? "",
      target_amount: String(c.target_amount),
      collected_amount: String(c.collected_amount),
      deadline: c.deadline ?? "",
      is_active: c.is_active,
    });
    setShowForm(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Donasi</h1>
          <p className="mt-1 text-sm text-slate-400">Campaign donasi komunitas</p>
        </div>
        <button type="button" onClick={() => { if (isAdmin) { setShowForm(true); setEditId(null); } }} className="btn-primary" disabled={!isAdmin}>
          <Plus className="mr-1.5 h-4 w-4" /> Buat Campaign
        </button>
      </div>

      {!isAdmin && (
        <div className="glass-card flex items-center justify-between gap-4">
          <p className="text-sm text-slate-400">Login admin untuk mengelola campaign donasi.</p>
          <AdminLoginPrompt message="Login Admin" />
        </div>
      )}

      {error && !showForm && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {showForm && isAdmin && (
        <form onSubmit={handleSubmit} className="glass-card space-y-4">
          <h3 className="font-semibold text-slate-900">{editId ? "Edit" : "Buat"} Campaign</h3>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Judul</label>
              <input className="input" value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} required />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Deskripsi</label>
              <textarea className="input" rows={3} value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} />
            </div>
            <div>
              <label className="label">Target (Rp)</label>
              <input type="number" className="input" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} required />
            </div>
            <div>
              <label className="label">Terkumpul (Rp)</label>
              <input type="number" className="input" value={form.collected_amount} onChange={(e) => setForm({ ...form, collected_amount: e.target.value })} />
            </div>
            <div>
              <label className="label">Deadline</label>
              <input type="date" className="input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Simpan</button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner className="h-8 w-8" /></div>
      ) : campaigns.length === 0 ? (
        <div className="glass-card text-center text-sm text-slate-500">Belum ada campaign donasi.</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {campaigns.map((c) => {
            const pct = c.target_amount > 0 ? Math.min(100, Math.round((c.collected_amount / c.target_amount) * 100)) : 0;
            return (
            <div key={c.id} className="glass-card-hover group relative">
              {isAdmin && (
                <div className="absolute right-3 top-3 hidden gap-1 group-hover:flex">
                  <button type="button" onClick={() => startEdit(c)} className="rounded p-1 text-slate-400 hover:text-gold-dark"><Pencil className="h-4 w-4" /></button>
                  <button type="button" onClick={() => handleDelete(c.id)} className="rounded p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              )}
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-slate-900">{c.judul}</h3>
                  {!c.is_active && <span className="text-xs text-slate-500">Nonaktif</span>}
                </div>
                {c.deskripsi && <p className="mt-2 text-sm text-slate-400">{c.deskripsi}</p>}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{formatCurrency(c.collected_amount)}</span>
                    <span>{formatCurrency(c.target_amount)}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-gold-dark">{pct}% tercapai</p>
                </div>
                {c.deadline && <p className="mt-2 text-xs text-slate-500">Deadline: {formatDate(c.deadline)}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
