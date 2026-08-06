"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { EventEdition } from "@/lib/types";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";
import { LoadingSpinner } from "@/components/ui/Loading";

export default function AdminAgustusanPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [editions, setEditions] = useState<EventEdition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    year: String(new Date().getFullYear() + 1),
    title: "",
    description: "",
    starts_on: "",
    ends_on: "",
    registration_closes_at: "",
    status: "draft" as EventEdition["status"],
    make_active: true,
  });

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("event_editions")
      .select("*")
      .order("year", { ascending: false });
    setEditions((data ?? []) as EventEdition[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const year = parseInt(form.year, 10);
    if (!Number.isFinite(year) || year < 2020 || year > 2100) {
      setError("Tahun tidak valid.");
      return;
    }
    const title = form.title.trim() || `Agustusan HUT RI ${year}`;
    const slug = `hut-ri-${year}`;

    setSaving(true);

    if (form.make_active) {
      await supabase
        .from("event_editions")
        .update({ status: "archived" })
        .eq("status", "active");
    }

    const { data, error: err } = await supabase
      .from("event_editions")
      .insert({
        year,
        slug,
        title,
        description: form.description.trim() || null,
        starts_on: form.starts_on || null,
        ends_on: form.ends_on || null,
        registration_closes_at: form.registration_closes_at
          ? new Date(form.registration_closes_at).toISOString()
          : null,
        status: form.make_active ? "active" : form.status,
      })
      .select("year")
      .single();

    setSaving(false);

    if (err) {
      setError(
        getSupabaseErrorMessage(err) ??
          "Gagal membuat edisi. Pastikan tahun belum dipakai."
      );
      return;
    }

    router.push(`/activities/agustusan/${data.year}`);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/activities" className="text-sm text-slate-500 hover:text-accent">
            ← Kegiatan
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Kelola Agustusan</h1>
          <p className="mt-1 text-sm text-slate-500">
            Event tahunan HUT RI — beda dari kegiatan biasa di menu Tambah Kegiatan.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setShowForm((v) => !v);
            setError(null);
          }}
        >
          {showForm ? "Tutup form" : "+ Edisi tahun baru"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass-card space-y-4">
          <h2 className="font-semibold text-slate-900">Buat edisi tahunan</h2>
          <p className="text-sm text-slate-500">
            Contoh: 2027 untuk HUT RI ke-82. Setelah dibuat, isi lomba/galeri di halaman edisi.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Tahun</label>
              <input
                type="number"
                className="input"
                required
                min={2020}
                max={2100}
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Judul</label>
              <input
                className="input"
                placeholder={`Agustusan HUT RI ${form.year}`}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Deskripsi singkat</label>
              <textarea
                className="input"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Mulai (opsional)</label>
              <input
                type="date"
                className="input"
                value={form.starts_on}
                onChange={(e) => setForm({ ...form, starts_on: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Selesai (opsional)</label>
              <input
                type="date"
                className="input"
                value={form.ends_on}
                onChange={(e) => setForm({ ...form, ends_on: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Batas daftar peserta (opsional)</label>
              <input
                type="datetime-local"
                className="input"
                value={form.registration_closes_at}
                onChange={(e) =>
                  setForm({ ...form, registration_closes_at: e.target.value })
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={form.make_active}
                onChange={(e) =>
                  setForm({ ...form, make_active: e.target.checked })
                }
              />
              Jadikan edisi aktif (edisi aktif lama diarsipkan)
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Menyimpan…" : "Buat edisi"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowForm(false)}
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {editions.length === 0 ? (
        <p className="text-sm text-slate-500">
          Belum ada edisi. Buat edisi baru di atas, atau jalankan seed SQL Agustusan 2026.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {editions.map((e) => (
            <li key={e.id}>
              <Link
                href={`/activities/agustusan/${e.year}`}
                className="flex items-center justify-between px-4 py-4 hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium text-slate-900">{e.title}</p>
                  <p className="text-xs text-slate-500 capitalize">{e.status}</p>
                </div>
                <span className="text-sm text-slate-500">{e.year} →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
