"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, MessageCircle, Share2 } from "lucide-react";
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
import { sharePengaduan } from "@/lib/pengaduan/share";

const AVATAR_TONES = [
  "bg-[#1f4b3a] text-[#d4e8df]",
  "bg-[#3d2c1e] text-[#f0e0c8]",
  "bg-[#1e3a4c] text-[#c8dff0]",
  "bg-[#4a2f1a] text-[#f5e6d3]",
  "bg-[#2c2438] text-[#e4daf0]",
  "bg-[#3a3320] text-[#efe8d4]",
] as const;

function avatarTone(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash + name.charCodeAt(i) * (i + 1)) % AVATAR_TONES.length;
  }
  return AVATAR_TONES[hash] ?? AVATAR_TONES[0];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function ThreadAvatar({
  name,
  accent,
  size = "md",
}: {
  name: string;
  accent?: boolean;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm";
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold tracking-wide ring-2 ring-white",
        dim,
        accent ? "bg-gold text-white" : avatarTone(name),
      )}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}

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
  const [shareLabel, setShareLabel] = useState("Bagikan");
  const [sharing, setSharing] = useState(false);

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

  async function handleShare() {
    if (!pengaduan || sharing) return;
    setSharing(true);
    const result = await sharePengaduan(pengaduan);
    setSharing(false);

    if (result === "cancelled") return;

    if (result === "copied") {
      setShareLabel("Tautan disalin");
    } else if (result === "whatsapp") {
      setShareLabel("Dibuka di WhatsApp");
    } else if (result === "shared") {
      setShareLabel("Terkirim");
    } else {
      setShareLabel("Coba lagi");
    }
    window.setTimeout(() => setShareLabel("Bagikan"), 2200);
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

  const replyCount = komentar.length;
  const showComposer = surface !== "landing";
  const hasThreadBelow = replyCount > 0 || showComposer;
  const shareDone =
    shareLabel === "Tautan disalin" ||
    shareLabel === "Terkirim" ||
    shareLabel === "Dibuka di WhatsApp";

  return (
    <div className="relative mx-auto max-w-xl pb-24">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href="/pengaduan"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-gold-dark"
        >
          <ArrowLeft className="h-4 w-4" />
          Thread
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="font-mono text-[11px] text-slate-400">
            {pengaduan.kode ?? pengaduan.id.slice(0, 8)}
          </span>
          <StatusBadge
            status={pengaduanStatusLabel(pengaduan.status)}
            variant={getPengaduanVariant(pengaduan.status)}
          />
        </div>
      </div>

      {canManage && (
        <div className="mb-4 rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/10 to-white px-4 py-3 transition duration-300">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gold-dark">
            Tindak lanjut pengurus
          </p>
          <PengaduanStatusActions
            pengaduan={pengaduan}
            busy={busy}
            size="md"
            onUpdate={updateStatus}
          />
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        {/* Original post */}
        <article className="px-4 pt-4 sm:px-5">
          <div className="flex gap-3">
            <div className="flex flex-col items-center self-stretch">
              <ThreadAvatar name={pengaduan.nama} />
              {hasThreadBelow && (
                <div className="mt-1 w-0.5 flex-1 rounded-full bg-slate-200" />
              )}
            </div>
            <div className="min-w-0 flex-1 pb-4">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <p className="font-semibold text-slate-900">{pengaduan.nama}</p>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Pelapor
                </span>
                <span className="text-xs text-slate-400">
                  {timeAgo(pengaduan.created_at)}
                </span>
              </div>
              {pengaduan.blok && (
                <p className="mt-0.5 text-xs text-slate-500">Blok {pengaduan.blok}</p>
              )}
              <p className="mt-2 text-[15px] font-medium text-slate-800">
                {pengaduan.kategori}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700">
                {pengaduan.deskripsi}
              </p>
              {pengaduan.foto_url && isPortalStorageUrl(pengaduan.foto_url) && (
                <a
                  href={pengaduan.foto_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block overflow-hidden rounded-2xl border border-slate-100"
                >
                  <StoredImage
                    src={pengaduan.foto_url}
                    alt={`Foto pengaduan ${pengaduan.nama}`}
                    className="max-h-80 w-full object-cover transition duration-300 hover:scale-[1.01]"
                  />
                </a>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500">
                  <MessageCircle className="h-4 w-4" />
                  {replyCount} balasan
                </span>
              </div>
            </div>
          </div>
        </article>

        {/* Replies */}
        {komentar.map((k, index) => {
          const connectAfter = index < komentar.length - 1 || showComposer;
          return (
            <div
              key={k.id}
              className="px-4 transition duration-300 sm:px-5"
              style={{
                animation: "pengaduanThreadIn 0.35s ease-out both",
                animationDelay: `${Math.min(index, 8) * 35}ms`,
              }}
            >
              <div className="flex gap-3">
                <div className="flex flex-col items-center self-stretch">
                  <ThreadAvatar name={k.nama} accent={k.is_pengurus} />
                  {connectAfter && (
                    <div className="mt-1 w-0.5 flex-1 rounded-full bg-slate-200" />
                  )}
                </div>
                <div className="min-w-0 flex-1 border-t border-slate-100 py-3">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <p className="font-semibold text-slate-900">{k.nama}</p>
                    {k.is_pengurus && (
                      <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-dark">
                        Pengurus
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {timeAgo(k.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700">
                    {k.pesan}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {/* Composer — field jelas untuk warga awam */}
        {showComposer ? (
          <form
            onSubmit={handleReply}
            className="border-t border-slate-200 bg-slate-50/70 px-4 py-4 sm:px-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <ThreadAvatar
                name={form.nama || (isOps ? "Pengurus" : "Warga")}
                accent={isOps}
                size="sm"
              />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {isOps ? "Balas sebagai pengurus" : "Tulis balasan Anda"}
                </p>
                <p className="text-xs text-slate-500">
                  Balasan tampil publik di thread ini
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              {!isOps ? (
                <div>
                  <label htmlFor="reply-nama" className="label">
                    Nama lengkap
                  </label>
                  <input
                    id="reply-nama"
                    className="input"
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    required
                    minLength={2}
                    placeholder="Contoh: Budi Santoso"
                    autoComplete="name"
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-gold/20 bg-gold/5 px-3 py-2 text-sm">
                  <span className="font-semibold text-slate-900">{form.nama}</span>
                  <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-gold-dark">
                    Pengurus
                  </span>
                </div>
              )}

              <div className="border-t border-slate-100 pt-3">
                <label htmlFor="reply-pesan" className="label">
                  Isi balasan
                </label>
                <textarea
                  id="reply-pesan"
                  className="input min-h-[100px]"
                  rows={4}
                  value={form.pesan}
                  onChange={(e) => setForm({ ...form, pesan: e.target.value })}
                  required
                  minLength={1}
                  placeholder="Tulis tanggapan, informasi tambahan, atau dukungan Anda..."
                />
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-3">
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
              </div>
            </div>
          </form>
        ) : (
          <div className="border-t border-slate-100 px-4 py-4 text-sm text-slate-500 sm:px-5">
            Balas thread di portal warga atau ops Nahara.
          </div>
        )}
      </div>

      {/* Floating share — satu tombol, tidak memenuhi header/kartu */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-end p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          {(sharing || shareDone || shareLabel === "Coba lagi") && (
            <span className="rounded-full bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
              {sharing ? "Membuka..." : shareLabel}
            </span>
          )}
          <button
            type="button"
            onClick={handleShare}
            disabled={sharing}
            className="inline-flex h-14 touch-manipulation items-center gap-2 rounded-full bg-slate-900 px-5 text-sm font-semibold text-white shadow-lg shadow-slate-900/25 transition hover:bg-slate-800 active:scale-[0.98] disabled:opacity-70"
            aria-label="Bagikan pengaduan ke warga lain"
          >
            {shareDone ? (
              <Check className="h-5 w-5 text-emerald-300" />
            ) : (
              <Share2 className="h-5 w-5" />
            )}
            Bagikan
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes pengaduanThreadIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
