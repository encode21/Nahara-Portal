"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MessageSquareHeart } from "lucide-react";
import { AgustusanFeedbackForm } from "@/components/agustusan/AgustusanFeedbackForm";
import { AgustusanFeedbackList } from "@/components/agustusan/AgustusanFeedbackList";
import { AgustusanFeedbackShareButton } from "@/components/agustusan/AgustusanFeedbackShareButton";
import { LoadingSpinner } from "@/components/ui/Loading";
import { createClient } from "@/lib/supabase/client";
import type { EventEdition } from "@/lib/types";

type Props = {
  year: number;
  /** Link kembali — beda landing vs portal. */
  backHref: string;
  backLabel?: string;
  formSource?: "share" | "hub";
};

export function AgustusanMasukanPage({
  year,
  backHref,
  backLabel = "Kembali",
  formSource = "share",
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [edition, setEdition] = useState<EventEdition | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

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
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-slate-600">Edisi {year} tidak ditemukan.</p>
        <Link href={backHref} className="mt-4 inline-block text-[#7a1218] hover:underline">
          {backLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 px-4 pb-16 pt-6 sm:px-1">
      <div>
        <Link
          href={backHref}
          className="text-sm font-medium text-[#7a1218] hover:underline"
        >
          ← {backLabel}
        </Link>
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium tracking-[0.18em] text-[#9b1b23] uppercase">
          <MessageSquareHeart className="h-3.5 w-3.5" />
          Evaluasi warga
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">
          Rating & usulan {edition.year}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Tanpa login. Boleh anonim. Rating dan usulan warga membantu panitia merancang
          Agustusan berikutnya agar lebih proper dan lebih nyaman.
        </p>
        <div className="mt-4">
          <AgustusanFeedbackShareButton year={edition.year} title={edition.title} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold text-slate-900">Kirim masukan</h2>
        <p className="mt-1 mb-4 text-sm text-slate-600">
          Apa yang bagus, yang kurang, dan ide lomba atau rundown tahun depan.
        </p>
        <AgustusanFeedbackForm
          editionId={edition.id}
          source={formSource}
          onSubmitted={() => setRefreshKey((k) => k + 1)}
        />
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-lg font-bold text-slate-900">
          Review & usulan warga
        </h2>
        <p className="text-sm text-slate-600">
          Dibaca panitia untuk evaluasi. Usulan yang masuk bisa jadi referensi Agustusan
          berikutnya.
        </p>
        <AgustusanFeedbackList editionId={edition.id} refreshKey={refreshKey} />
      </div>
    </div>
  );
}
