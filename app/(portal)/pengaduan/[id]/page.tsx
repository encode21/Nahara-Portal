"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Pengaduan, PengaduanKomentar } from "@/lib/types";
import { timeAgo, cn } from "@/lib/utils";
import { StatusBadge, getPengaduanVariant } from "@/components/ui/StatusBadge";
import { LoadingSpinner } from "@/components/ui/Loading";
import { StoredImage } from "@/components/ui/StoredImage";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAppSurface, useHasMounted } from "@/lib/hooks/useAppSurface";
import { isPortalStorageUrl } from "@/lib/supabase/storage";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";
import {
  pengaduanStatusLabel,
  type PengaduanStatus,
} from "@/lib/constants/pengaduan";
import { PengaduanStatusActions } from "@/components/pengaduan/PengaduanStatusActions";

export default function PengaduanDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const supabase = createClient();
  const surface = useAppSurface();
  const mounted = useHasMounted();
  const { isAdmin, isStaff, user } = useAuth();
  const canManage = mounted && (isAdmin || isStaff) && surface !== "landing";
  const isOps = isAdmin || isStaff;

  const [pengaduan, setPengaduan] = useState<Pengaduan | null>(null);
  const [komentar, setKomentar] = useState<PengaduanKomentar[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ nama: "", pesan: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [pRes, kRes] = await Promise.all([
      supabase.from("pengaduan").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("pengaduan_komentar")
        .select("*")
        .eq("pengaduan_id", id)
        .order("created_at", { ascending: true }),
    ]);
    setPengaduan((pRes.data as Pengaduan | null) ?? null);
    setKomentar((kRes.data ?? []) as PengaduanKomentar[]);
    setLoading(false);
  }, [supabase, id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!isOps || !user) return;
    const name =
      (user.user_metadata?.full_name as string | undefined)?.trim() ||
      user.email?.split("@")[0] ||
      "Pengurus";
    setForm((f) => (f.nama ? f : { ...f, nama: name }));
  }, [isOps, user]);

  async function updateStatus(status: PengaduanStatus) {
    if (!canManage || !pengaduan) return;
    setBusy(true);
    await supabase.from("pengaduan").update({ status }).eq("id", pengaduan.id);
    setBusy(false);
    fetchData();
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!pengaduan) return;
    setSubmitting(true);
    setError(null);

    const payload = {
      pengaduan_id: pengaduan.id,
      nama: form.nama.trim(),
      pesan: form.pesan.trim(),
      is_pengurus: !!isOps,
    };

    const { error: insertError } = await supabase
      .from("pengaduan_komentar")
      .insert(payload);

    setSubmitting(false);

    if (insertError) {
      setError(
        getSupabaseErrorMessage(insertError) ?? "Gagal mengirim balasan.",
      );
      return;
    }

    setForm((f) => ({ ...f, pesan: "" }));
    fetchData();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (!pengaduan) {
    return (
      <div className="space-y-4 py-8 text-center">
        <p className="text-sm text-slate-500">Pengaduan tidak ditemukan.</p>
        <Link href="/pengaduan" className="btn-secondary inline-flex">
          Kembali ke daftar
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/pengaduan"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-gold-dark"
        >
          <ArrowLeft className="h-4 w-4" />
          Semua pengaduan
        </Link>
      </div>

      <article className="glass-card space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-slate-400">
              {pengaduan.kode ?? pengaduan.id.slice(0, 8)}
            </p>
            <h1 className="mt-1 font-display text-xl font-bold text-slate-900">
              {pengaduan.kategori}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Dilapor oleh <span className="font-medium">{pengaduan.nama}</span>
              {pengaduan.blok ? ` · ${pengaduan.blok}` : ""}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {timeAgo(pengaduan.created_at)}
            </p>
          </div>
          <StatusBadge
            status={pengaduanStatusLabel(pengaduan.status)}
            variant={getPengaduanVariant(pengaduan.status)}
          />
        </div>

        {pengaduan.foto_url && isPortalStorageUrl(pengaduan.foto_url) && (
          <a
            href={pengaduan.foto_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <StoredImage
              src={pengaduan.foto_url}
              alt={`Foto pengaduan ${pengaduan.nama}`}
              className="max-h-80 w-full rounded-lg object-cover"
            />
          </a>
        )}

        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
          {pengaduan.deskripsi}
        </p>

        {canManage && (
          <div className="border-t border-slate-100 pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              Tindak lanjut
            </p>
            <PengaduanStatusActions
              pengaduan={pengaduan}
              busy={busy}
              size="md"
              onUpdate={updateStatus}
            />
          </div>
        )}
      </article>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-gold-dark" />
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Thread diskusi
          </h2>
          <span className="text-sm text-slate-400">
            ({komentar.length} balasan)
          </span>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-slate-900">{pengaduan.nama}</p>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                Pelapor
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
              {pengaduan.deskripsi}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              {timeAgo(pengaduan.created_at)}
            </p>
          </div>

          {komentar.map((k) => (
            <div
              key={k.id}
              className={cn(
                "rounded-xl border p-4",
                k.is_pengurus
                  ? "border-gold/30 bg-gold/5"
                  : "border-slate-200 bg-white",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-slate-900">{k.nama}</p>
                {k.is_pengurus && (
                  <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-gold-dark">
                    Pengurus
                  </span>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                {k.pesan}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                {timeAgo(k.created_at)}
              </p>
            </div>
          ))}
        </div>

        {surface === "landing" ? (
          <div className="glass-card text-sm text-slate-500">
            Balas thread di portal warga atau ops Nahara.
          </div>
        ) : (
          <form onSubmit={handleReply} className="glass-card space-y-3">
            <p className="text-sm font-medium text-slate-900">
              {isOps ? "Balas sebagai pengurus" : "Tambah balasan warga"}
            </p>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
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
                placeholder="Nama lengkap"
                readOnly={isOps}
              />
            </div>
            <div>
              <label className="label">Pesan</label>
              <textarea
                className="input"
                rows={3}
                value={form.pesan}
                onChange={(e) => setForm({ ...form, pesan: e.target.value })}
                required
                minLength={1}
                placeholder="Tulis tanggapan atau informasi tambahan..."
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <LoadingSpinner /> Mengirim...
                </span>
              ) : (
                "Kirim balasan"
              )}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
