"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Warga } from "@/lib/types";
import { useAuth } from "@/lib/hooks/useAuth";
import { AdminLoginPrompt } from "@/components/AdminOnly";
import { LoadingSpinner } from "@/components/ui/Loading";
import { useAppSurface } from "@/lib/hooks/useAppSurface";
import { buildOpsUrl } from "@/lib/host";
import { timeAgo } from "@/lib/utils";
import {
  isWargaActive7d,
  isWargaInactive30d,
  isWargaOnline,
} from "@/lib/warga-presence";

type StatusFilter = "all" | "online" | "active7d" | "inactive";

export default function AktivitasWargaPage() {
  const supabase = createClient();
  const surface = useAppSurface();
  const { isWargaRegistry, loading: authLoading } = useAuth();
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [now, setNow] = useState(() => Date.now());

  const canView = isWargaRegistry;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("warga").select("*");
    setWargaList((data ?? []) as Warga[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!canView) return;
    fetchData();
  }, [canView, fetchData]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const summary = useMemo(() => {
    let online = 0;
    let active7d = 0;
    let inactive = 0;
    for (const w of wargaList) {
      if (isWargaOnline(w.last_seen_at, now)) online += 1;
      if (isWargaActive7d(w.last_seen_at, now)) active7d += 1;
      if (isWargaInactive30d(w.last_seen_at, now)) inactive += 1;
    }
    return { online, active7d, inactive, total: wargaList.length };
  }, [wargaList, now]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = wargaList.filter((w) => {
      const matchSearch =
        !q ||
        w.nama.toLowerCase().includes(q) ||
        w.blok.toLowerCase().includes(q);
      if (!matchSearch) return false;
      if (statusFilter === "online") return isWargaOnline(w.last_seen_at, now);
      if (statusFilter === "active7d")
        return isWargaActive7d(w.last_seen_at, now);
      if (statusFilter === "inactive")
        return isWargaInactive30d(w.last_seen_at, now);
      return true;
    });

    return rows.sort((a, b) => {
      const ta = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0;
      const tb = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0;
      return tb - ta;
    });
  }, [wargaList, search, statusFilter, now]);

  if (authLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="glass-card space-y-3">
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Aktivitas Warga
        </h1>
        <p className="text-sm text-slate-500">
          Halaman ini hanya untuk Ketua, IT, Sekretaris, atau Admin. Login di
          ops.nahara.id.
        </p>
        {surface !== "ops" ? (
          <a href={buildOpsUrl("/login")} className="btn-primary inline-flex">
            Masuk ops
          </a>
        ) : (
          <AdminLoginPrompt message="Login pengurus" />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Aktivitas Warga
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Last seen & status online warga yang sudah konfirmasi identity di
          portal
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setStatusFilter("online")}
          className={`glass-card text-left transition ${
            statusFilter === "online" ? "ring-2 ring-gold/40" : ""
          }`}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Online
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-emerald-700">
            {summary.online}
          </p>
          <p className="mt-1 text-xs text-slate-500">Aktif &lt; 5 menit</p>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("active7d")}
          className={`glass-card text-left transition ${
            statusFilter === "active7d" ? "ring-2 ring-gold/40" : ""
          }`}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Aktif 7 hari
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-slate-900">
            {summary.active7d}
          </p>
          <p className="mt-1 text-xs text-slate-500">Pernah akses belakangan</p>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("inactive")}
          className={`glass-card text-left transition ${
            statusFilter === "inactive" ? "ring-2 ring-gold/40" : ""
          }`}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Tidak aktif
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-slate-900">
            {summary.inactive}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            &gt; 30 hari / belum pernah
          </p>
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-10"
            placeholder="Cari nama atau blok..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="all">Semua ({summary.total})</option>
          <option value="online">Online</option>
          <option value="active7d">Aktif 7 hari</option>
          <option value="inactive">Tidak aktif</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card text-center text-sm text-slate-500">
          Tidak ada warga yang cocok.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((w) => {
            const online = isWargaOnline(w.last_seen_at, now);
            return (
              <div
                key={w.id}
                className="glass-card flex flex-wrap items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{w.nama}</p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        online
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          online ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                      />
                      {online ? "Online" : "Offline"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gold-dark">{w.blok}</p>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <p className="flex items-center justify-end gap-1.5">
                    <Activity className="h-3.5 w-3.5" />
                    {w.last_seen_at
                      ? timeAgo(w.last_seen_at)
                      : "Belum pernah akses"}
                  </p>
                  {w.last_path ? (
                    <p className="mt-1 font-mono text-xs text-slate-400">
                      {w.last_path}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
