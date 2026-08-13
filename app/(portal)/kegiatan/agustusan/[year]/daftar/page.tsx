"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { EventEdition } from "@/lib/types";
import { PEAK_EVENT } from "@/lib/constants/agustusan";
import { PeakRegistrationForm } from "@/components/agustusan/PeakRegistrationForm";
import { LoadingSpinner } from "@/components/ui/Loading";

export default function PeakDaftarPage() {
  const params = useParams();
  const year = Number(params.year);
  const supabase = useMemo(() => createClient(), []);
  const [edition, setEdition] = useState<EventEdition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Number.isFinite(year)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("event_editions")
        .select("*")
        .eq("year", year)
        .maybeSingle();
      if (!cancelled) {
        setEdition((data as EventEdition) ?? null);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, year]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (!edition) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-600">Edisi {year} tidak ditemukan.</p>
        <Link href="/kegiatan/agustusan" className="mt-4 inline-block text-accent hover:underline">
          Kembali
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-1 pb-10">
      <div>
        <Link
          href={`/kegiatan/agustusan/${year}`}
          className="text-sm font-medium text-[#7a1218] hover:underline"
        >
          ← Kembali
        </Link>
        <p className="mt-3 text-xs font-medium tracking-[0.18em] text-[#9b1b23] uppercase">
          QR Pendaftaran
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">
          {PEAK_EVENT.title}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {PEAK_EVENT.startsAtLabel} · {PEAK_EVENT.location}
        </p>
      </div>
      <PeakRegistrationForm edition={edition} year={year} />
    </div>
  );
}
