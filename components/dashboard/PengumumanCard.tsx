"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Pengumuman } from "@/lib/types";
import { formatShortDate } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/useAuth";
import { Plus } from "lucide-react";
import { StoredImage } from "@/components/ui/StoredImage";

type PengumumanCardProps = {
  pengumuman?: Pengumuman[];
};

export function PengumumanCard({ pengumuman: initial = [] }: PengumumanCardProps) {
  const supabase = createClient();
  const { isAdmin } = useAuth();
  const [list, setList] = useState<Pengumuman[]>(initial);

  const fetchData = useCallback(async () => {
    const { data } = await supabase
      .from("pengumuman")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3);
    setList((data ?? []) as Pengumuman[]);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="glass-card flex h-full flex-col">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-slate-900">Pengumuman</h3>
        {isAdmin && (
          <Link
            href="/pengumuman"
            className="flex items-center gap-1 rounded-lg border border-gold/30 bg-gold-light px-2 py-1 text-xs font-medium text-gold-dark hover:bg-gold/20"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah
          </Link>
        )}
      </div>

      {list.length === 0 ? (
        <p className="mt-4 flex-1 text-sm text-slate-500">
          {isAdmin
            ? "Belum ada pengumuman. Buka halaman Pengumuman untuk menulis."
            : "Belum ada pengumuman dari pengurus."}
        </p>
      ) : (
        <div className="mt-4 flex-1 space-y-3">
          {list.map((p) => (
            <div key={p.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              {p.image_url && (
                <StoredImage
                  src={p.image_url}
                  alt=""
                  className="mb-2 h-20 w-full rounded object-cover"
                />
              )}
              <p className="text-sm font-medium text-slate-800">{p.judul}</p>
              {p.isi && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{p.isi}</p>}
              <p className="mt-2 text-xs text-slate-400">{formatShortDate(p.created_at)}</p>
            </div>
          ))}
        </div>
      )}

      <Link href="/pengumuman" className="btn-secondary mt-4 w-full text-center text-xs">
        Lihat Semua Pengumuman
      </Link>
    </div>
  );
}
