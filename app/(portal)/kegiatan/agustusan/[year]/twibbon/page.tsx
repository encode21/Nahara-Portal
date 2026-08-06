"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { EventEdition } from "@/lib/types";
import { TwibbonMaker } from "@/components/agustusan/TwibbonMaker";
import { LoadingSpinner } from "@/components/ui/Loading";

export default function TwibbonPage() {
  const params = useParams();
  const year = Number(params.year);
  const supabase = useMemo(() => createClient(), []);
  const [edition, setEdition] = useState<EventEdition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("event_editions")
        .select("*")
        .eq("year", year)
        .maybeSingle();
      setEdition((data ?? null) as EventEdition | null);
      setLoading(false);
    }
    if (Number.isFinite(year)) load();
  }, [supabase, year]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (!edition) {
    return <p className="py-12 text-center text-slate-600">Edisi tidak ditemukan.</p>;
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <Link
          href={`/kegiatan/agustusan/${year}`}
          className="text-sm text-slate-500 hover:text-accent"
        >
          ← {edition.title}
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold text-slate-900">
          Buat Twibbon
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Pakai frame HUT RI ke-81 Nahara. Unggah foto, atur posisi, lalu unduh atau bagikan.
        </p>
      </div>

      <TwibbonMaker year={year} shareTitle={edition.title} />
    </div>
  );
}
