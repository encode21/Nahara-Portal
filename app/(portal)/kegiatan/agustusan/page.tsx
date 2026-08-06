"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { EventEdition } from "@/lib/types";
import { AGUSTUSAN_TITLE, AGUSTUSAN_YEAR } from "@/lib/constants/agustusan";
import { LoadingSpinner } from "@/components/ui/Loading";

export default function AgustusanHubPage() {
  const supabase = useMemo(() => createClient(), []);
  const [editions, setEditions] = useState<EventEdition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("event_editions")
        .select("*")
        .order("year", { ascending: false });
      setEditions((data ?? []) as EventEdition[]);
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  const active = editions.find((e) => e.status === "active") ?? editions[0];
  const archived = editions.filter((e) => e.id !== active?.id);

  if (!active) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
        <h1 className="font-display text-2xl font-bold text-slate-900">{AGUSTUSAN_TITLE}</h1>
        <p className="text-sm text-slate-600">
          Data edisi belum ada. Jalankan migration{" "}
          <code className="rounded bg-slate-100 px-1 text-xs">20260806_event_editions_contests.sql</code>{" "}
          lalu seed{" "}
          <code className="rounded bg-slate-100 px-1 text-xs">202608_agustusan_lomba_2026.sql</code>.
        </p>
        <Link href={`/kegiatan/agustusan/${AGUSTUSAN_YEAR}`} className="btn-primary inline-flex">
          Coba buka {AGUSTUSAN_YEAR}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium tracking-wide text-[#9b1b23] uppercase">Event tahunan</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-slate-900">Agustusan Nahara</h1>
        <p className="mt-2 max-w-xl text-sm text-slate-600">
          Pilih edisi HUT RI. Edisi aktif berisi donasi, daftar lomba, pendaftaran peserta, dan juara.
        </p>
      </div>

      <Link
        href={`/kegiatan/agustusan/${active.year}`}
        className="block rounded-2xl border border-[#c9a84c]/30 bg-gradient-to-br from-[#7a1218] to-[#9b1b23] p-6 text-white transition hover:opacity-95 sm:p-8"
      >
        <p className="text-xs font-medium tracking-widest text-[#f0d78c] uppercase">Edisi aktif</p>
        <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">{active.title}</h2>
        {active.description && (
          <p className="mt-2 max-w-xl text-sm text-white/80">{active.description}</p>
        )}
        <p className="mt-4 text-sm font-medium text-[#f0d78c]">Buka edisi {active.year} →</p>
      </Link>

      {archived.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-display text-lg font-semibold text-slate-900">Arsip</h3>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {archived.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/kegiatan/agustusan/${e.year}`}
                  className="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-900">{e.title}</span>
                  <span className="text-slate-500">{e.year}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
