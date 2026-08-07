"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Pengaduan } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { StatusBadge, getPengaduanVariant } from "@/components/ui/StatusBadge";
import { LoadingSpinner } from "@/components/ui/Loading";
import { StoredImage } from "@/components/ui/StoredImage";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAppSurface, useHasMounted } from "@/lib/hooks/useAppSurface";
import { AdminLoginPrompt } from "@/components/AdminOnly";
import { isPortalStorageUrl } from "@/lib/supabase/storage";

const STATUSES = ["Baru", "Diproses", "Selesai"] as const;
const KATEGORI = ["Keamanan", "Kebersihan", "Infrastruktur", "Lainnya"];

export default function PengaduanPage() {
  const supabase = createClient();
  const surface = useAppSurface();
  const mounted = useHasMounted();
  const { isAdmin } = useAuth();
  const readOnly = !mounted || surface === "landing";
  const canManage = mounted && isAdmin && surface !== "landing";
  const [list, setList] = useState<Pengaduan[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("pengaduan").select("*").order("created_at", { ascending: false });
    if (statusFilter) query = query.eq("status", statusFilter);
    if (kategoriFilter) query = query.eq("kategori", kategoriFilter);
    const { data } = await query;
    setList((data ?? []) as Pengaduan[]);
    setLoading(false);
  }, [supabase, statusFilter, kategoriFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function updateStatus(id: string, status: string) {
    if (!canManage) return;
    await supabase.from("pengaduan").update({ status }).eq("id", id);
    fetchData();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Pengaduan</h1>
          <p className="mt-1 text-sm text-slate-400">
            {readOnly
              ? "Status laporan lingkungan dari warga (lihat saja)"
              : canManage
                ? "Kelola laporan warga"
                : "Lihat status pengaduan lingkungan"}
          </p>
        </div>
        {!readOnly && (
          <Link href="/pengaduan/baru" className="btn-primary">
            <Plus className="mr-1.5 h-4 w-4" /> Buat Pengaduan
          </Link>
        )}
      </div>

      {!canManage && !readOnly && (
        <div className="glass-card flex items-center justify-between gap-4">
          <p className="text-sm text-slate-400">Ingin mengubah status pengaduan?</p>
          <AdminLoginPrompt message="Login Admin" />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <select
          className="input w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Semua Status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className="input w-auto"
          value={kategoriFilter}
          onChange={(e) => setKategoriFilter(e.target.value)}
        >
          <option value="">Semua Kategori</option>
          {KATEGORI.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      ) : list.length === 0 ? (
        <div className="glass-card text-center text-sm text-slate-500">Belum ada pengaduan.</div>
      ) : (
        <div className="space-y-4">
          {list.map((p) => (
            <article key={p.id} className="glass-card overflow-hidden">
              <div className="flex flex-col gap-4 sm:flex-row">
                {p.foto_url && isPortalStorageUrl(p.foto_url) && (
                  <a
                    href={p.foto_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 sm:w-40"
                  >
                    <StoredImage
                      src={p.foto_url}
                      alt={`Foto pengaduan ${p.nama}`}
                      className="h-32 w-full rounded-lg object-cover sm:h-full sm:min-h-[120px]"
                    />
                  </a>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{p.nama}</p>
                      {p.blok && <p className="text-xs text-slate-500">{p.blok}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={p.kategori} variant="neutral" />
                      <StatusBadge status={p.status} variant={getPengaduanVariant(p.status)} />
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{p.deskripsi}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-slate-400">{timeAgo(p.created_at)}</p>
                    {canManage && (
                      <select
                        className="input w-auto py-1 text-xs"
                        value={p.status}
                        onChange={(e) => updateStatus(p.id, e.target.value)}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
