"use client";

import type { Pengaduan } from "@/lib/types";
import type { PengaduanStatus } from "@/lib/constants/pengaduan";

type PengaduanStatusActionsProps = {
  pengaduan: Pengaduan;
  onUpdate: (status: PengaduanStatus) => void;
  onDelete?: () => void;
  canDelete?: boolean;
  busy?: boolean;
  size?: "sm" | "md";
};

export function PengaduanStatusActions({
  pengaduan,
  onUpdate,
  onDelete,
  canDelete = false,
  busy = false,
  size = "sm",
}: PengaduanStatusActionsProps) {
  const btn =
    size === "sm"
      ? "rounded-lg px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-50"
      : "rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50";

  const deleteBtn = canDelete && onDelete ? (
    <button
      type="button"
      disabled={busy}
      onClick={onDelete}
      className={`${btn} border border-red-200 bg-white text-red-600 hover:bg-red-50`}
    >
      Hapus
    </button>
  ) : null;

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
        {deleteBtn}
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
        {deleteBtn}
      </div>
    );
  }

  if (pengaduan.status === "Ditolak") {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => onUpdate("Diproses")}
          className={`${btn} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
        >
          Proses ulang
        </button>
        {deleteBtn}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-emerald-700">Laporan selesai</span>
      {deleteBtn}
    </div>
  );
}
