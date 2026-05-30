"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CctvCamera } from "@/lib/types";
import { Plus, Pencil, Trash2, Camera, Wifi, WifiOff } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/Loading";
import { useAuth } from "@/lib/hooks/useAuth";
import { AdminLoginPrompt } from "@/components/AdminOnly";

export default function CctvPage() {
  const supabase = createClient();
  const { isAdmin } = useAuth();
  const [cameras, setCameras] = useState<CctvCamera[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ nama: "", lokasi: "", stream_url: "", is_online: true });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("cctv_cameras").select("*").order("nama");
    setCameras((data ?? []) as CctvCamera[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      nama: form.nama,
      lokasi: form.lokasi || null,
      stream_url: form.stream_url || null,
      is_online: form.is_online,
    };
    if (editId) {
      await supabase.from("cctv_cameras").update(payload).eq("id", editId);
    } else {
      await supabase.from("cctv_cameras").insert(payload);
    }
    setShowForm(false);
    setEditId(null);
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus kamera ini?")) return;
    await supabase.from("cctv_cameras").delete().eq("id", id);
    fetchData();
  }

  function startEdit(c: CctvCamera) {
    setEditId(c.id);
    setForm({ nama: c.nama, lokasi: c.lokasi ?? "", stream_url: c.stream_url ?? "", is_online: c.is_online });
    setShowForm(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">CCTV</h1>
          <p className="mt-1 text-sm text-slate-400">Monitoring kamera lingkungan</p>
        </div>
        <button type="button" onClick={() => { if (isAdmin) { setShowForm(true); setEditId(null); } }} className="btn-primary" disabled={!isAdmin}>
          <Plus className="mr-1.5 h-4 w-4" /> Tambah Kamera
        </button>
      </div>

      {!isAdmin && (
        <div className="glass-card flex items-center justify-between gap-4">
          <p className="text-sm text-slate-400">Login admin untuk mengelola daftar kamera.</p>
          <AdminLoginPrompt message="Login Admin" />
        </div>
      )}

      {showForm && isAdmin && (
        <form onSubmit={handleSubmit} className="glass-card space-y-4">
          <h3 className="font-semibold text-slate-900">{editId ? "Edit" : "Tambah"} Kamera</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Nama</label>
              <input className="input" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required />
            </div>
            <div>
              <label className="label">Lokasi</label>
              <input className="input" value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Stream URL</label>
              <input className="input" value={form.stream_url} onChange={(e) => setForm({ ...form, stream_url: e.target.value })} placeholder="https://..." />
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
      ) : cameras.length === 0 ? (
        <div className="glass-card text-center text-sm text-slate-500">Belum ada kamera terdaftar.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cameras.map((cam) => (
            <div key={cam.id} className="glass-card-hover group relative">
              {isAdmin && (
                <div className="absolute right-3 top-3 hidden gap-1 group-hover:flex">
                  <button type="button" onClick={() => startEdit(cam)} className="rounded p-1 text-slate-400 hover:text-gold-dark"><Pencil className="h-4 w-4" /></button>
                  <button type="button" onClick={() => handleDelete(cam.id)} className="rounded p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50">
                  <Camera className="h-5 w-5 text-slate-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{cam.nama}</p>
                  {cam.lokasi && <p className="text-xs text-slate-500">{cam.lokasi}</p>}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs">
                {cam.is_online ? (
                  <><Wifi className="h-3.5 w-3.5 text-gold-dark" /><span className="text-gold-dark">Online</span></>
                ) : (
                  <><WifiOff className="h-3.5 w-3.5 text-red-600" /><span className="text-red-600">Offline</span></>
                )}
              </div>
              <button
                type="button"
                onClick={() => setExpanded(expanded === cam.id ? null : cam.id)}
                className="btn-secondary mt-3 w-full text-xs"
              >
                {expanded === cam.id ? "Tutup Stream" : "Lihat Stream"}
              </button>
              {expanded === cam.id && (
                <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-black/40 aspect-video flex items-center justify-center">
                  {cam.stream_url ? (
                    <iframe src={cam.stream_url} className="h-full w-full" title={cam.nama} allow="autoplay" />
                  ) : (
                    <p className="text-xs text-slate-500">Stream placeholder — URL belum dikonfigurasi</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
