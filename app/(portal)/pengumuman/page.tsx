"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Pengumuman } from "@/lib/types";
import { Plus } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/Loading";
import { useAuth } from "@/lib/hooks/useAuth";
import { AdminLoginPrompt } from "@/components/AdminOnly";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";
import { PengumumanCardItem } from "@/components/pengumuman/PengumumanCardItem";
import { PengumumanDetailModal } from "@/components/pengumuman/PengumumanDetailModal";
import { PengumumanFormModal } from "@/components/pengumuman/PengumumanFormModal";

export default function PengumumanPage() {
  const supabase = createClient();
  const { isAdmin, user } = useAuth();
  const [list, setList] = useState<Pengumuman[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Pengumuman | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ judul: "", isi: "", image_url: null as string | null });

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
    setForm({ judul: "", isi: "", image_url: null });
    setError(null);
    setSelected(null);
    setShowForm(true);
  }

  function openEdit(p: Pengumuman) {
    setEditId(p.id);
    setForm({ judul: p.judul, isi: p.isi ?? "", image_url: p.image_url });
    setError(null);
    setSelected(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      judul: form.judul.trim(),
      isi: form.isi.trim() || null,
      image_url: form.image_url,
      created_by: user?.email ?? null,
    };

    const result = editId
      ? await supabase
          .from("pengumuman")
          .update({ judul: payload.judul, isi: payload.isi, image_url: payload.image_url })
          .eq("id", editId)
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
    setSelected(null);
    fetchData();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Pengumuman</h1>
          <p className="mt-1 text-sm text-slate-500">
            Informasi resmi komunitas — ketuk kartu untuk detail
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

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner className="h-8 w-8" /></div>
      ) : list.length === 0 ? (
        <div className="glass-card text-center text-sm text-slate-500">
          {isAdmin
            ? "Belum ada pengumuman. Klik \"Tambah Pengumuman\" untuk membuat yang pertama."
            : "Belum ada pengumuman dari pengurus."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <PengumumanCardItem
              key={p.id}
              item={p}
              isAdmin={isAdmin}
              onOpen={() => setSelected(p)}
              onEdit={() => openEdit(p)}
              onDelete={() => handleDelete(p.id)}
            />
          ))}
        </div>
      )}

      <PengumumanDetailModal
        item={selected}
        open={!!selected}
        isAdmin={isAdmin}
        onClose={() => setSelected(null)}
        onEdit={() => {
          if (selected) openEdit(selected);
        }}
        onDelete={() => {
          if (selected) void handleDelete(selected.id);
        }}
      />

      <PengumumanFormModal
        open={showForm && isAdmin}
        editId={editId}
        form={form}
        error={error}
        onChange={setForm}
        onSubmit={handleSubmit}
        onClose={() => setShowForm(false)}
      />
    </div>
  );
}
