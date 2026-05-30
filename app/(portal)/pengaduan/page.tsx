"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Pengaduan } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { StatusBadge, getPengaduanVariant } from "@/components/ui/StatusBadge";
import { LoadingSpinner } from "@/components/ui/Loading";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { AdminLoginPrompt } from "@/components/AdminOnly";

const STATUSES = ["Baru", "Diproses", "Selesai"] as const;
const KATEGORI = ["Keamanan", "Kebersihan", "Infrastruktur", "Lainnya"];

export default function PengaduanPage() {
  const supabase = createClient();
  const { isAdmin } = useAuth();
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

  useEffect(() => { fetchData(); }, [fetchData]);

  async function updateStatus(id: string, status: string) {
    if (!isAdmin) return;
    await supabase.from("pengaduan").update({ status }).eq("id", id);
    fetchData();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Pengaduan</h1>
          <p className="mt-1 text-sm text-slate-400">
            {isAdmin ? "Kelola laporan warga" : "Lihat status pengaduan lingkungan"}
          </p>
        </div>
        <Link href="/pengaduan/baru" className="btn-primary">
          <Plus className="mr-1.5 h-4 w-4" /> Buat Pengaduan
        </Link>
      </div>

      {!isAdmin && (
        <div className="glass-card flex items-center justify-between gap-4">
          <p className="text-sm text-slate-400">Ingin mengubah status pengaduan?</p>
          <AdminLoginPrompt message="Login Admin" />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Semua Status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input w-auto" value={kategoriFilter} onChange={(e) => setKategoriFilter(e.target.value)}>
          <option value="">Semua Kategori</option>
          {KATEGORI.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner className="h-8 w-8" /></div>
      ) : list.length === 0 ? (
        <div className="glass-card text-center text-sm text-slate-500">Belum ada pengaduan.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-400">
                <th className="px-4 py-3">Nama / Blok</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Deskripsi</th>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Status</th>
                {isAdmin && <th className="px-4 py-3">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{p.nama}</p>
                    {p.blok && <p className="text-xs text-slate-500">{p.blok}</p>}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={p.kategori} variant="neutral" /></td>
                  <td className="max-w-xs px-4 py-3 text-slate-400">{p.deskripsi}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{timeAgo(p.created_at)}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} variant={getPengaduanVariant(p.status)} /></td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <select
                        className="input w-auto py-1 text-xs"
                        value={p.status}
                        onChange={(e) => updateStatus(p.id, e.target.value)}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
