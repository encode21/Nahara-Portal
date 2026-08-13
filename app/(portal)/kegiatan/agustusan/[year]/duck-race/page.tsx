"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { EventEdition, EventPeakRegistration } from "@/lib/types";
import { PEAK_EVENT } from "@/lib/constants/agustusan";
import { LoadingSpinner } from "@/components/ui/Loading";

function uniqueHouseholds(rows: EventPeakRegistration[]): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    if (r.status === "verified") set.add(r.household_label);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "id"));
}

export default function PublicDuckRaceTvPage() {
  const params = useParams();
  const year = Number(params.year);
  const supabase = useMemo(() => createClient(), []);
  const [labels, setLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: ed } = await supabase
        .from("event_editions")
        .select("id")
        .eq("year", year)
        .maybeSingle();
      if (!ed) {
        if (!cancelled) setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("event_peak_registrations")
        .select("*")
        .eq("edition_id", (ed as EventEdition).id)
        .eq("status", "verified");
      if (!cancelled) {
        setLabels(uniqueHouseholds((data ?? []) as EventPeakRegistration[]));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, year]);

  return (
    <div className="-mx-4 -mt-6 min-h-[calc(100vh-4rem)] bg-[#1a0508] text-white lg:-mx-6 lg:-mt-8">
      <div className="border-b border-white/10 px-4 py-4 text-center sm:px-6">
        <p className="font-display text-xl font-bold tracking-wide sm:text-3xl">
          NAHARA 81 TAHUN INDONESIA
        </p>
        <p className="mt-1 text-sm tracking-[0.25em] text-[#f0d78c] uppercase sm:text-base">
          HADIAH UTAMA
        </p>
        <Link
          href={`/kegiatan/agustusan/${year}`}
          className="mt-2 inline-block text-xs text-white/50 hover:text-white/80"
        >
          Kembali
        </Link>
      </div>

      <div className="mx-auto grid max-w-[1600px] gap-4 p-4 lg:grid-cols-[1fr_280px] lg:p-6">
        <div className="overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
          <iframe
            title="Duck Race fullscreen"
            src={PEAK_EVENT.duckRaceEmbedUrl}
            className="h-[55vh] w-full min-h-[320px] lg:h-[75vh]"
            allow="fullscreen"
          />
        </div>
        <aside className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <p className="text-sm font-semibold text-[#f0d78c]">Peserta Duck Race</p>
          <p className="mt-1 text-2xl font-bold">{loading ? "…" : labels.length} rumah</p>
          <div className="mt-4 max-h-[60vh] space-y-1 overflow-y-auto text-sm tabular-nums">
            {labels.map((l) => (
              <div key={l} className="border-b border-white/10 py-1.5">
                {l}
              </div>
            ))}
            {!loading && labels.length === 0 && (
              <p className="text-white/50">Belum ada rumah verified.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
