"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Warga } from "@/lib/types";
import { StatusBadge, getHunianVariant } from "@/components/ui/StatusBadge";
import { BLOK_ROWS } from "@/lib/constants/cluster-layout";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/Loading";
import { useAuth } from "@/lib/hooks/useAuth";
import { AdminLoginPrompt } from "@/components/AdminOnly";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";

export default function InfoWargaPage() {
  const supabase = createClient();
  const { isAdmin } = useAuth();
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [blokFilter, setBlokFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nama: "",
    blok: "",
    blok_row: "",
    nomor_kavling: "",
    status_hunian: "Tetap" as Warga["status_hunian"],
    telepon: "",
  });
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("warga").select("*").order("blok");
    setWargaList((data ?? []) as Warga[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = wargaList.filter((w) => {
    const matchSearch = !search || w.nama.toLowerCase().includes(search.toLowerCase()) || w.blok.toLowerCase().includes(search.toLowerCase());
    const matchBlok = !blokFilter || w.blok_row === blokFilter;
    return matchSearch && matchBlok;
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      nama: form.nama,
      blok: form.blok,
      blok_row: form.blok_row,
      nomor_kavling: form.nomor_kavling ? parseInt(form.nomor_kavling, 10) : null,
      status_hunian: form.status_hunian,
      telepon: form.telepon || null,
    };
    const result = editId
      ? await supabase.from("warga").update(payload).eq("id", editId)
      : await supabase.from("warga").insert(payload);

    const err = getSupabaseErrorMessage(result.error);
    if (err) {
      setError(err);
      return;
    }
    setShowForm(false);
    setEditId(null);
    setForm({ nama: "", blok: "", blok_row: "", nomor_kavling: "", status_hunian: "Tetap", telepon: "" });
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus warga ini?")) return;
    await supabase.from("warga").delete().eq("id", id);
    fetchData();
  }

  function startEdit(w: Warga) {
    setEditId(w.id);
    setForm({
      nama: w.nama,
      blok: w.blok,
      blok_row: w.blok_row,
      nomor_kavling: w.nomor_kavling ? String(w.nomor_kavling) : "",
      status_hunian: w.status_hunian,
      telepon: w.telepon ?? "",
    });
    setShowForm(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Info Warga</h1>
          <p className="mt-1 text-sm text-slate-400">Direktori warga per blok</p>
        </div>
        <button type="button" onClick={() => { if (isAdmin) { setShowForm(true); setEditId(null); } }} className="btn-primary" disabled={!isAdmin}>
          <Plus className="mr-1.5 h-4 w-4" /> Tambah Warga
        </button>
      </div>

      {!isAdmin && (
        <div className="glass-card flex items-center justify-between gap-4">
          <p className="text-sm text-slate-400">Login admin untuk menambah atau mengedit data warga.</p>
          <AdminLoginPrompt message="Login Admin" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input className="input pl-10" placeholder="Cari nama atau blok..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={blokFilter} onChange={(e) => setBlokFilter(e.target.value)}>
          <option value="">Semua Blok</option>
          {BLOK_ROWS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {showForm && isAdmin && (
        <form onSubmit={handleSubmit} className="glass-card space-y-4">
          <h3 className="font-semibold text-slate-900">{editId ? "Edit" : "Tambah"} Warga</h3>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Nama</label>
              <input className="input" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required />
            </div>
            <div>
              <label className="label">Blok (e.g. NHT-1/05)</label>
              <input className="input" value={form.blok} onChange={(e) => setForm({ ...form, blok: e.target.value })} required />
            </div>
            <div>
              <label className="label">Blok Row</label>
              <select className="input" value={form.blok_row} onChange={(e) => setForm({ ...form, blok_row: e.target.value })} required>
                <option value="">Pilih</option>
                {BLOK_ROWS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Nomor Kavling</label>
              <input type="number" className="input" value={form.nomor_kavling} onChange={(e) => setForm({ ...form, nomor_kavling: e.target.value })} />
            </div>
            <div>
              <label className="label">Status Hunian</label>
              <select className="input" value={form.status_hunian} onChange={(e) => setForm({ ...form, status_hunian: e.target.value as Warga["status_hunian"] })}>
                <option value="Tetap">Tetap</option>
                <option value="Kontrak">Kontrak</option>
                <option value="Kosong">Kosong</option>
              </select>
            </div>
            <div>
              <label className="label">Telepon</label>
              <input className="input" value={form.telepon} onChange={(e) => setForm({ ...form, telepon: e.target.value })} />
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
      ) : filtered.length === 0 ? (
        <div className="glass-card text-center text-sm text-slate-500">Belum ada data warga.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((w) => (
            <div key={w.id} className="glass-card-hover group relative">
              {isAdmin && (
                <div className="absolute right-3 top-3 hidden gap-1 group-hover:flex">
                  <button type="button" onClick={() => startEdit(w)} className="rounded p-1 text-slate-400 hover:text-gold-dark"><Pencil className="h-4 w-4" /></button>
                  <button type="button" onClick={() => handleDelete(w.id)} className="rounded p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              )}
              <p className="font-semibold text-slate-900">{w.nama}</p>
              <p className="mt-1 text-sm text-gold-dark">{w.blok}</p>
              <div className="mt-2">
                <StatusBadge status={w.status_hunian} variant={getHunianVariant(w.status_hunian)} />
              </div>
              {w.telepon && <p className="mt-2 text-xs text-slate-500">{w.telepon}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
