"use client";

import type { Pengaduan } from "@/lib/types";
import {
  PENGADUAN_STATUS_COLORS,
  PENGADUAN_STATUSES,
  pengaduanStatusLabel,
  type PengaduanStatus,
} from "@/lib/constants/pengaduan";

type Counts = Record<PengaduanStatus, number>;

function countByStatus(list: Pengaduan[]): Counts {
  const counts: Counts = { Baru: 0, Diproses: 0, Ditolak: 0, Selesai: 0 };
  for (const p of list) {
    if (p.status in counts) counts[p.status as PengaduanStatus] += 1;
  }
  return counts;
}

function donutGradient(counts: Counts, total: number): string {
  if (total === 0) return "conic-gradient(#e2e8f0 0deg 360deg)";
  let cursor = 0;
  const parts: string[] = [];
  for (const status of PENGADUAN_STATUSES) {
    const n = counts[status];
    if (n === 0) continue;
    const start = (cursor / total) * 360;
    cursor += n;
    const end = (cursor / total) * 360;
    parts.push(`${PENGADUAN_STATUS_COLORS[status]} ${start}deg ${end}deg`);
  }
  return `conic-gradient(${parts.join(", ")})`;
}

export function PengaduanStats({ list }: { list: Pengaduan[] }) {
  const counts = countByStatus(list);
  const total = list.length;
  const selesaiPct = total === 0 ? 0 : (counts.Selesai / total) * 100;

  return (
    <div className="glass-card">
      <div className="mb-4">
        <h2 className="font-display text-lg font-semibold text-slate-900">
          Statistik Laporan
        </h2>
        <p className="text-sm text-slate-500">Ringkasan status pengaduan warga</p>
      </div>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div
          className="relative h-40 w-40 shrink-0 rounded-full"
          style={{ background: donutGradient(counts, total) }}
          aria-hidden
        >
          <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-white text-center shadow-sm">
            <p className="font-display text-3xl font-bold text-slate-900">{total}</p>
            <p className="px-2 text-[11px] leading-tight text-slate-500">
              {selesaiPct.toFixed(1)}% laporan selesai
            </p>
          </div>
        </div>

        <ul className="w-full flex-1 space-y-2">
          {PENGADUAN_STATUSES.map((status) => (
            <li
              key={status}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2.5"
            >
              <span className="flex items-center gap-2 text-sm text-slate-700">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: PENGADUAN_STATUS_COLORS[status] }}
                />
                {pengaduanStatusLabel(status)}
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {counts[status]}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
