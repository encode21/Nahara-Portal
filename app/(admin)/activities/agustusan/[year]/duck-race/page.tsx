"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, Copy, Download } from "lucide-react";
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

export default function AdminDuckRacePage() {
  const params = useParams();
  const year = Number(params.year);
  const supabase = useMemo(() => createClient(), []);
  const [edition, setEdition] = useState<EventEdition | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: ed } = await supabase
        .from("event_editions")
        .select("*")
        .eq("year", year)
        .maybeSingle();
      const editionRow = (ed as EventEdition) ?? null;
      if (cancelled) return;
      setEdition(editionRow);
      if (!editionRow) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("event_peak_registrations")
        .select("*")
        .eq("edition_id", editionRow.id)
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

  async function copyList() {
    await navigator.clipboard.writeText(labels.join("\n"));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function download(ext: "txt" | "csv") {
    const body = ext === "csv" ? "household\n" + labels.join("\n") : labels.join("\n");
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `duck-race-peserta-${year}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

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

  const tvHref = `/kegiatan/agustusan/${year}/duck-race`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href={`/activities/agustusan/${year}/doorprize`}
            className="text-sm text-slate-500 hover:underline"
          >
            ← Door Prize
          </Link>
          <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">
            Duck Race — Hadiah Utama
          </h1>
          <p className="text-sm text-slate-600">
            Peserta = rumah verified (1 rumah = 1 duck)
          </p>
        </div>
        <Link href={tvHref} target="_blank" className="btn-primary">
          Buka mode TV
        </Link>
      </div>

      <div className="card space-y-4">
        <p className="text-sm font-medium text-slate-900">
          Peserta Duck Race: <span className="text-2xl font-bold">{labels.length}</span> rumah
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={copyList}>
            {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
            Copy list
          </button>
          <button type="button" className="btn-secondary" onClick={() => download("txt")}>
            <Download className="mr-1.5 h-4 w-4" />
            TXT
          </button>
          <button type="button" className="btn-secondary" onClick={() => download("csv")}>
            <Download className="mr-1.5 h-4 w-4" />
            CSV
          </button>
        </div>
        <pre className="max-h-80 overflow-auto rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">
          {labels.length ? labels.join("\n") : "Belum ada rumah verified."}
        </pre>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black">
        <iframe
          title="Duck Race"
          src={PEAK_EVENT.duckRaceEmbedUrl}
          className="aspect-video w-full min-h-[360px]"
          allow="fullscreen"
        />
      </div>
    </div>
  );
}
