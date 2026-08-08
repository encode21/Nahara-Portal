"use client";

import { Suspense, useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Pengaduan } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { StatusBadge, getPengaduanVariant } from "@/components/ui/StatusBadge";
import { LoadingSpinner } from "@/components/ui/Loading";
import { StoredImage } from "@/components/ui/StoredImage";
import { Plus, Search, ChevronRight, Share2, Check } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAppSurface, useHasMounted } from "@/lib/hooks/useAppSurface";
import { AdminLoginPrompt } from "@/components/AdminOnly";
import { isPortalStorageUrl } from "@/lib/supabase/storage";
import {
  PENGADUAN_KATEGORI,
  PENGADUAN_TABS,
  pengaduanStatusLabel,
  statusForTab,
  tabFromSearch,
  type PengaduanStatus,
  type PengaduanTabId,
} from "@/lib/constants/pengaduan";
import { PengaduanStats } from "@/components/pengaduan/PengaduanStats";
import { PengaduanStatusActions } from "@/components/pengaduan/PengaduanStatusActions";
import { sharePengaduan } from "@/lib/pengaduan/share";
import { sanitizeSearchTerm } from "@/lib/validation/publicForms";
import { cn } from "@/lib/utils";

function PengaduanPageContent() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const surface = useAppSurface();
  const mounted = useHasMounted();
  const { isAdmin, isStaff } = useAuth();
  const readOnly = !mounted || surface === "landing";
  const canManage = mounted && (isAdmin || isStaff) && surface !== "landing";
  const canDelete = mounted && isAdmin && surface !== "landing";

  const [allList, setAllList] = useState<Pengaduan[]>([]);
  const [list, setList] = useState<Pengaduan[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState<PengaduanTabId>(() =>
    tabFromSearch(searchParams.get("tab")),
  );
  const [kategoriFilter, setKategoriFilter] = useState("");
  const [search, setSearch] = useState("");
  const [shareFeedbackId, setShareFeedbackId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const { data } = await supabase
      .from("pengaduan")
      .select("*")
      .order("created_at", { ascending: false });
    setAllList((data ?? []) as Pengaduan[]);
  }, [supabase]);

  const fetchFiltered = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("pengaduan")
      .select("*")
      .order("created_at", { ascending: false });

    const status = statusForTab(tab);
    if (status) query = query.eq("status", status);
    if (kategoriFilter) query = query.eq("kategori", kategoriFilter);

    const q = sanitizeSearchTerm(search);
    if (q) {
      query = query.or(
        `kode.ilike.%${q}%,nama.ilike.%${q}%,deskripsi.ilike.%${q}%`,
      );
    }

    const { data } = await query;
    setList((data ?? []) as Pengaduan[]);
    setLoading(false);
  }, [supabase, tab, kategoriFilter, search]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    fetchFiltered();
  }, [fetchFiltered]);

  useEffect(() => {
    setTab(tabFromSearch(searchParams.get("tab")));
  }, [searchParams]);

  function selectTab(next: PengaduanTabId) {
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "semua") params.delete("tab");
    else params.set("tab", next);
    const qs = params.toString();
    router.replace(qs ? `/pengaduan?${qs}` : "/pengaduan", { scroll: false });
  }

  async function updateStatus(id: string, status: PengaduanStatus) {
    if (!canManage) return;
    setBusyId(id);
    await supabase.from("pengaduan").update({ status }).eq("id", id);
    setBusyId(null);
    await Promise.all([fetchAll(), fetchFiltered()]);
  }

  async function deletePengaduan(id: string) {
    if (!canDelete) return;
    if (!confirm("Hapus pengaduan ini beserta seluruh balasan thread?")) return;
    setBusyId(id);
    const { error } = await supabase.from("pengaduan").delete().eq("id", id);
    setBusyId(null);
    if (error) {
      alert(error.message || "Gagal menghapus pengaduan.");
      return;
    }
    await Promise.all([fetchAll(), fetchFiltered()]);
  }

  async function handleShare(p: Pengaduan, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const result = await sharePengaduan(p);
    if (result === "cancelled") return;
    setShareFeedbackId(p.id);
    window.setTimeout(() => setShareFeedbackId(null), 2000);
  }

  const tabCounts = useMemo(() => {
    const counts: Record<PengaduanTabId, number> = {
      semua: allList.length,
      validasi: 0,
      diproses: 0,
      ditolak: 0,
      selesai: 0,
    };
    for (const p of allList) {
      if (p.status === "Baru") counts.validasi += 1;
      else if (p.status === "Diproses") counts.diproses += 1;
      else if (p.status === "Ditolak") counts.ditolak += 1;
      else if (p.status === "Selesai") counts.selesai += 1;
    }
    return counts;
  }, [allList]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Pengaduan</h1>
          <p className="mt-1 text-sm text-slate-400">
            {readOnly
              ? "Status laporan lingkungan dari warga — tanpa login"
              : canManage
                ? "Validasi & tindak lanjut laporan warga"
                : "Lihat status pengaduan lingkungan"}
          </p>
        </div>
        {!readOnly && (
          <Link href="/pengaduan/baru" className="btn-primary">
            <Plus className="mr-1.5 h-4 w-4" /> Buat Pengaduan
          </Link>
        )}
      </div>

      <PengaduanStats list={allList} />

      {!canManage && !readOnly && (
        <div className="glass-card flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate-400">
            Ingin memvalidasi atau mengubah status pengaduan?
          </p>
          <AdminLoginPrompt message="Login Pengurus" />
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
        {PENGADUAN_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => selectTab(t.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-gold/15 text-gold-dark"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
            )}
          >
            {t.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                tab === t.id ? "bg-gold/25 text-gold-dark" : "bg-slate-100 text-slate-500",
              )}
            >
              {tabCounts[t.id]}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Cari kode, nama, atau deskripsi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-auto"
          value={kategoriFilter}
          onChange={(e) => setKategoriFilter(e.target.value)}
        >
          <option value="">Semua Kategori</option>
          {PENGADUAN_KATEGORI.map((k) => (
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
        <div className="glass-card text-center text-sm text-slate-500">
          Belum ada pengaduan untuk filter ini.
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((p) => (
            <article key={p.id} className="glass-card overflow-hidden">
              <div className="flex gap-3">
                {p.foto_url && isPortalStorageUrl(p.foto_url) ? (
                  <StoredImage
                    src={p.foto_url}
                    alt={`Foto pengaduan ${p.nama}`}
                    className="h-20 w-20 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                    No foto
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-slate-400">
                        {p.kode ?? p.id.slice(0, 8)}
                      </p>
                      <p className="truncate font-medium text-slate-900">{p.kategori}</p>
                      <p className="text-sm text-slate-600">
                        {p.nama}
                        {p.blok ? ` · ${p.blok}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        status={pengaduanStatusLabel(p.status)}
                        variant={getPengaduanVariant(p.status)}
                      />
                      <span className="text-xs text-slate-400">
                        {timeAgo(p.created_at)}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{p.deskripsi}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    {canManage ? (
                      <PengaduanStatusActions
                        pengaduan={p}
                        busy={busyId === p.id}
                        canDelete={canDelete}
                        onDelete={() => deletePengaduan(p.id)}
                        onUpdate={(status) => updateStatus(p.id, status)}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleShare(p, e)}
                        className="inline-flex touch-manipulation items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-gold/40 hover:bg-gold/5 hover:text-gold-dark"
                      >
                        {shareFeedbackId === p.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            Dibagikan
                          </>
                        ) : (
                          <>
                            <Share2 className="h-3.5 w-3.5" />
                            Bagikan
                          </>
                        )}
                      </button>
                    )}
                    <div className="flex items-center gap-2">
                      {canManage && (
                        <button
                          type="button"
                          onClick={(e) => handleShare(p, e)}
                          className="inline-flex touch-manipulation items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-gold-dark"
                          aria-label="Bagikan pengaduan"
                        >
                          {shareFeedbackId === p.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Share2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                      <Link
                        href={`/pengaduan/${p.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-gold-dark hover:underline"
                      >
                        Lihat thread
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
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

export default function PengaduanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      }
    >
      <PengaduanPageContent />
    </Suspense>
  );
}
