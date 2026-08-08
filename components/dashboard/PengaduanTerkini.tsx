import Link from "next/link";
import type { Pengaduan } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { StatusBadge, getPengaduanVariant } from "@/components/ui/StatusBadge";
import { pengaduanStatusLabel } from "@/lib/constants/pengaduan";

type PengaduanTerkiniProps = {
  pengaduan: Pengaduan[];
};

export function PengaduanTerkini({ pengaduan }: PengaduanTerkiniProps) {
  return (
    <div className="glass-card flex h-full flex-col">
      <h3 className="font-display text-lg font-semibold text-slate-900">
        Pengaduan Terkini
      </h3>
      {pengaduan.length === 0 ? (
        <p className="mt-4 flex-1 text-sm text-slate-500">Belum ada pengaduan.</p>
      ) : (
        <div className="mt-4 flex-1 space-y-3">
          {pengaduan.map((p) => (
            <Link
              key={p.id}
              href={`/pengaduan/${p.id}`}
              className="block rounded-lg border border-slate-100 bg-slate-50 p-3 transition hover:border-gold/30 hover:bg-gold/5"
            >
              <div className="flex items-start justify-between gap-2">
                <StatusBadge status={p.kategori} variant="neutral" />
                <StatusBadge
                  status={pengaduanStatusLabel(p.status)}
                  variant={getPengaduanVariant(p.status)}
                />
              </div>
              {p.kode && (
                <p className="mt-2 font-mono text-[11px] text-slate-400">{p.kode}</p>
              )}
              <p className="mt-1 text-sm font-medium text-slate-700">{p.nama}</p>
              {p.blok && <p className="text-xs text-slate-500">{p.blok}</p>}
              <p className="mt-1 line-clamp-2 text-xs text-slate-400">{p.deskripsi}</p>
              <p className="mt-2 text-xs text-slate-600">{timeAgo(p.created_at)}</p>
            </Link>
          ))}
        </div>
      )}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Link
          href="/pengaduan?tab=validasi"
          className="btn-secondary flex-1 text-center text-xs"
        >
          Antrean Validasi
        </Link>
        <Link href="/pengaduan" className="btn-secondary flex-1 text-center text-xs">
          Lihat Semua
        </Link>
      </div>
    </div>
  );
}
