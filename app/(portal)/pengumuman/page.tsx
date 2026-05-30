"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Pengumuman } from "@/lib/types";
import { formatShortDate } from "@/lib/utils";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/Loading";
import { useAuth } from "@/lib/hooks/useAuth";
import { AdminLoginPrompt } from "@/components/AdminOnly";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";

export default function PengumumanPage() {
  const supabase = createClient();
  const { isAdmin, user } = useAuth();
  const [list, setList] = useState<Pengumuman[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ judul: "", isi: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("pengumuman")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) setError(getSupabaseErrorMessage(fetchError));
    setList((data ?? []) as Pengumuman[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openCreate() {
    setEditId(null);
    setForm({ judul: "", isi: "" });
    setError(null);
    setShowForm(true);
  }

  function openEdit(p: Pengumuman) {
    setEditId(p.id);
    setForm({ judul: p.judul, isi: p.isi ?? "" });
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      judul: form.judul.trim(),
      isi: form.isi.trim() || null,
      created_by: user?.email ?? null,
    };

    const result = editId
      ? await supabase.from("pengumuman").update({ judul: payload.judul, isi: payload.isi }).eq("id", editId)
      : await supabase.from("pengumuman").insert(payload);

    const err = getSupabaseErrorMessage(result.error);
    if (err) {
      setError(err);
      return;
    }

    setShowForm(false);
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus pengumuman ini?")) return;
    const { error: delError } = await supabase.from("pengumuman").delete().eq("id", id);
    const err = getSupabaseErrorMessage(delError);
    if (err) {
      setError(err);
      return;
    }
    fetchData();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Pengumuman</h1>
          <p className="mt-1 text-sm text-slate-500">
            Informasi resmi komunitas — tampil di dashboard untuk semua warga
          </p>
        </div>
        {isAdmin && (
          <button type="button" onClick={openCreate} className="btn-primary">
            <Plus className="mr-1.5 h-4 w-4" /> Tambah Pengumuman
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="glass-card flex items-center justify-between gap-4">
          <p className="text-sm text-slate-500">Login admin untuk menambah atau mengedit pengumuman.</p>
          <AdminLoginPrompt message="Login Admin" />
        </div>
      )}

      {error && !showForm && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {showForm && isAdmin && (
        <form onSubmit={handleSubmit} className="glass-card space-y-4">
          <h3 className="font-semibold text-slate-900">{editId ? "Edit" : "Tambah"} Pengumuman</h3>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="label">Judul</label>
            <input
              className="input"
              placeholder="Contoh: Rapat RT Bulan Juni"
              value={form.judul}
              onChange={(e) => setForm({ ...form, judul: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Isi Pengumuman</label>
            <textarea
              className="input"
              rows={5}
              placeholder="Tulis detail pengumuman di sini..."
              value={form.isi}
              onChange={(e) => setForm({ ...form, isi: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Simpan</button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner className="h-8 w-8" /></div>
      ) : list.length === 0 ? (
        <div className="glass-card text-center text-sm text-slate-500">
          {isAdmin
            ? "Belum ada pengumuman. Klik \"Tambah Pengumuman\" untuk membuat yang pertama."
            : "Belum ada pengumuman dari pengurus."}
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((p) => (
            <article key={p.id} className="glass-card-hover group relative">
              {isAdmin && (
                <div className="absolute right-4 top-4 flex gap-1">
                  <button type="button" onClick={() => openEdit(p)} className="rounded p-1.5 text-slate-400 hover:text-gold-dark">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => handleDelete(p.id)} className="rounded p-1.5 text-slate-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
              <h2 className="pr-16 font-semibold text-slate-900">{p.judul}</h2>
              {p.isi && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{p.isi}</p>}
              <p className="mt-3 text-xs text-slate-400">{formatShortDate(p.created_at)}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
