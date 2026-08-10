"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/ui/Loading";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";
import { PENGADUAN_KATEGORI } from "@/lib/constants/pengaduan";
import { PUBLIC_LIMITS } from "@/lib/validation/publicForms";

export default function PengaduanBaruPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    nama: "",
    blok: "",
    kategori: "Keamanan",
    deskripsi: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const nama = form.nama.trim();
    const deskripsi = form.deskripsi.trim();
    const blok = form.blok.trim();

    if (nama.length < 2 || nama.length > PUBLIC_LIMITS.nama) {
      setError(`Nama harus 2–${PUBLIC_LIMITS.nama} karakter.`);
      setLoading(false);
      return;
    }
    if (deskripsi.length < 3 || deskripsi.length > PUBLIC_LIMITS.deskripsi) {
      setError(`Deskripsi harus 3–${PUBLIC_LIMITS.deskripsi} karakter.`);
      setLoading(false);
      return;
    }
    if (!PENGADUAN_KATEGORI.includes(form.kategori as (typeof PENGADUAN_KATEGORI)[number])) {
      setError("Kategori tidak valid.");
      setLoading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("pengaduan")
      .insert({
        nama,
        blok: blok ? blok.slice(0, PUBLIC_LIMITS.blok) : null,
        kategori: form.kategori,
        deskripsi: deskripsi.slice(0, PUBLIC_LIMITS.deskripsi),
        foto_url: fotoUrl,
        status: "Baru",
      })
      .select("id, kode")
      .single();

    setLoading(false);

    if (insertError || !data) {
      setError(
        getSupabaseErrorMessage(insertError) ??
          "Gagal mengirim pengaduan. Silakan coba lagi.",
      );
      return;
    }

    const params = new URLSearchParams();
    if (data.kode) params.set("kode", data.kode);
    params.set("id", data.id);
    params.set("kategori", form.kategori);
    router.push(`/pengaduan/baru/sukses?${params.toString()}`);
  }

  return (
    <div className="mx-auto max-w-lg py-4">
      <div className="mb-8 text-center">
        <h1 className="font-display text-2xl font-bold text-slate-900">Buat Pengaduan</h1>
        <p className="mt-1 text-sm text-slate-500">Laporkan masalah lingkungan tanpa perlu login</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="label">Nama</label>
          <input
            className="input"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            required
            minLength={2}
            maxLength={PUBLIC_LIMITS.nama}
          />
        </div>

        <div>
          <label className="label">Nomor Blok</label>
          <input
            className="input"
            placeholder="e.g. NHT-1/05"
            value={form.blok}
            onChange={(e) => setForm({ ...form, blok: e.target.value })}
            maxLength={PUBLIC_LIMITS.blok}
          />
        </div>

        <div>
          <label className="label">Kategori</label>
          <select className="input" value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })}>
            {PENGADUAN_KATEGORI.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Deskripsi</label>
          <textarea
            className="input"
            rows={4}
            value={form.deskripsi}
            onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
            required
            minLength={3}
            maxLength={PUBLIC_LIMITS.deskripsi}
          />
        </div>

        <ImageUpload
          folder="pengaduan"
          value={fotoUrl}
          onChange={setFotoUrl}
          label="Foto Bukti (opsional)"
          hint="Lampirkan foto kondisi lapangan — foto besar dikompres otomatis (maks. 5 MB). HEIC tidak didukung."
        />

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner /> Mengirim...
            </span>
          ) : (
            "Kirim Pengaduan"
          )}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500">
        <Link href="/login" className="text-gold-dark hover:underline">Login pengurus</Link>
      </p>
    </div>
  );
}
