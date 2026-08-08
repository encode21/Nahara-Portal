"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/ui/Loading";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";
import { PENGADUAN_KATEGORI } from "@/lib/constants/pengaduan";

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

    const { data, error: insertError } = await supabase
      .from("pengaduan")
      .insert({
        nama: form.nama,
        blok: form.blok || null,
        kategori: form.kategori,
        deskripsi: form.deskripsi,
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
          <input className="input" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required />
        </div>

        <div>
          <label className="label">Nomor Blok</label>
          <input className="input" placeholder="e.g. NHT-1/05" value={form.blok} onChange={(e) => setForm({ ...form, blok: e.target.value })} />
        </div>

        <div>
          <label className="label">Kategori</label>
          <select className="input" value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })}>
            {PENGADUAN_KATEGORI.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Deskripsi</label>
          <textarea className="input" rows={4} value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} required />
        </div>

        <ImageUpload
          folder="pengaduan"
          value={fotoUrl}
          onChange={setFotoUrl}
          label="Foto Bukti (opsional)"
          hint="Lampirkan foto kondisi lapangan — maks. 5 MB"
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
