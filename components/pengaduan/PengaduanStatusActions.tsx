"use client";

import type { Pengaduan } from "@/lib/types";
import type { PengaduanStatus } from "@/lib/constants/pengaduan";

type PengaduanStatusActionsProps = {
  pengaduan: Pengaduan;
  onUpdate: (status: PengaduanStatus) => void;
  busy?: boolean;
  size?: "sm" | "md";
};

export function PengaduanStatusActions({
  pengaduan,
  onUpdate,
  busy = false,
  size = "sm",
}: PengaduanStatusActionsProps) {
  const btn =
    size === "sm"
      ? "rounded-lg px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-50"
      : "rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50";

  if (pengaduan.status === "Baru") {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => onUpdate("Diproses")}
          className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}
        >
          Setujui
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onUpdate("Ditolak")}
          className={`${btn} bg-red-600 text-white hover:bg-red-700`}
        >
          Tolak
        </button>
      </div>
    );
  }

  if (pengaduan.status === "Diproses") {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => onUpdate("Selesai")}
          className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}
        >
          Tandai Selesai
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onUpdate("Ditolak")}
          className={`${btn} border border-red-200 bg-red-50 text-red-700 hover:bg-red-100`}
        >
          Tolak
        </button>
      </div>
    );
  }

  if (pengaduan.status === "Ditolak") {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => onUpdate("Diproses")}
        className={`${btn} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
      >
        Proses ulang
      </button>
    );
  }

  return (
    <span className="text-xs text-emerald-700">Laporan selesai</span>
  );
}
