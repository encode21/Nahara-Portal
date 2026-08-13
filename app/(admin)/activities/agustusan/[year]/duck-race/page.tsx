"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, Copy, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type {
  DuckRaceParticipant,
  EventDuckRace,
  EventEdition,
} from "@/lib/types";
import {
  buildDuckRaceWhatsAppText,
  normalizeDuckRace,
} from "@/lib/agustusan/duck-race";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";
import { LoadingSpinner } from "@/components/ui/Loading";
import { DuckRaceHistory } from "@/components/agustusan/DuckRaceHistory";
import { DuckRaceStage } from "@/components/agustusan/DuckRaceStage";

export default function AdminDuckRacePage() {
  const params = useParams();
  const year = Number(params.year);
  const supabase = useMemo(() => createClient(), []);
  const [edition, setEdition] = useState<EventEdition | null>(null);
  const [participants, setParticipants] = useState<DuckRaceParticipant[]>([]);
  const [history, setHistory] = useState<EventDuckRace[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedWa, setCopiedWa] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStage, setShowStage] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: ed } = await supabase
      .from("event_editions")
      .select("*")
      .eq("year", year)
      .maybeSingle();
    const editionRow = (ed as EventEdition) ?? null;
    setEdition(editionRow);
    if (!editionRow) {
      setParticipants([]);
      setHistory([]);
      setLoading(false);
      return;
    }

    const [listRes, histRes] = await Promise.all([
      supabase.rpc("list_duck_race_participants", {
        p_edition_id: editionRow.id,
      }),
      supabase
        .from("event_duck_races")
        .select("*")
        .eq("edition_id", editionRow.id)
        .order("created_at", { ascending: false }),
    ]);

    if (listRes.error) {
      // Fallback until migration applied
      const { data: regs } = await supabase
        .from("event_peak_registrations")
        .select("household_label, blok_row, nomor_kavling, twibbon_url")
        .eq("edition_id", editionRow.id)
        .eq("status", "verified");
      const map = new Map<string, DuckRaceParticipant>();
      for (const r of regs ?? []) {
        const row = r as DuckRaceParticipant & { twibbon_url: string | null };
        if (!row.twibbon_url?.trim()) continue;
        if (!map.has(row.household_label)) {
          map.set(row.household_label, {
            household_label: row.household_label,
            blok_row: row.blok_row,
            nomor_kavling: row.nomor_kavling,
          });
        }
      }
      setParticipants(
        Array.from(map.values()).sort((a, b) =>
          a.household_label.localeCompare(b.household_label, "id")
        )
      );
      if (listRes.error.message?.includes("list_duck_race")) {
        setError(
          "Migration Duck Race belum diterapkan. Jalankan supabase migration terlebih dahulu."
        );
      } else {
        setError(getSupabaseErrorMessage(listRes.error));
      }
    } else {
      setParticipants(
        Array.isArray(listRes.data)
          ? (listRes.data as DuckRaceParticipant[]).map((p) => ({
              household_label: p.household_label,
              blok_row: p.blok_row,
              nomor_kavling: Number(p.nomor_kavling),
            }))
          : []
      );
    }

    if (!histRes.error && histRes.data) {
      setHistory(
        (histRes.data as EventDuckRace[]).map((r) => normalizeDuckRace(r))
      );
    } else {
      setHistory([]);
    }

    setLoading(false);
  }, [supabase, year]);

  useEffect(() => {
    void load();
  }, [load]);

  const labels = participants.map((p) => p.household_label);
  const lastFinished = history.find(
    (r) => r.status === "finished" || r.winner_household_label
  );
  const tvHref = `/kegiatan/agustusan/${year}/duck-race`;

  async function copyList() {
    await navigator.clipboard.writeText(labels.join("\n"));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function copyLastWhatsApp() {
    if (!lastFinished) return;
    await navigator.clipboard.writeText(buildDuckRaceWhatsAppText(lastFinished));
    setCopiedWa(true);
    window.setTimeout(() => setCopiedWa(false), 2000);
  }

  function download(ext: "txt" | "csv") {
    const body =
      ext === "csv" ? "household\n" + labels.join("\n") : labels.join("\n");
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
    return (
      <p className="py-12 text-center text-slate-600">Edisi tidak ditemukan.</p>
    );
  }

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
            Native race · 1 rumah verified + twibbon = 1 duck · undian di server
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={tvHref} target="_blank" className="btn-primary">
            Buka mode TV
          </Link>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowStage((v) => !v)}
          >
            {showStage ? "Sembunyikan stage" : "Tampilkan stage di sini"}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </p>
      )}

      <div className="card space-y-4">
        <p className="text-sm font-medium text-slate-900">
          Peserta Duck Race:{" "}
          <span className="text-2xl font-bold">{participants.length}</span> rumah
        </p>
        <p className="text-sm text-slate-600">
          Pastikan daftar peserta sudah benar sebelum memulai race di mode TV.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={copyList}>
            {copied ? (
              <Check className="mr-1.5 h-4 w-4" />
            ) : (
              <Copy className="mr-1.5 h-4 w-4" />
            )}
            Copy list
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => download("txt")}
          >
            <Download className="mr-1.5 h-4 w-4" />
            TXT
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => download("csv")}
          >
            <Download className="mr-1.5 h-4 w-4" />
            CSV
          </button>
          {lastFinished && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => void copyLastWhatsApp()}
            >
              {copiedWa ? (
                <Check className="mr-1.5 h-4 w-4" />
              ) : (
                <Copy className="mr-1.5 h-4 w-4" />
              )}
              Copy hasil terakhir ke WhatsApp
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={() => void load()}>
            Refresh
          </button>
        </div>
        <pre className="max-h-80 overflow-auto rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">
          {labels.length ? labels.join("\n") : "Belum ada rumah eligible."}
        </pre>
      </div>

      {showStage && (
        <div className="space-y-2">
          <h2 className="font-display text-lg font-bold text-slate-900">
            Stage
          </h2>
          <DuckRaceStage year={year} variant="admin-preview" />
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-slate-900">
            Race History
          </h2>
          <button
            type="button"
            className="text-sm text-slate-500 hover:underline"
            onClick={() => void load()}
          >
            Refresh history
          </button>
        </div>
        <DuckRaceHistory races={history} />
      </div>
    </div>
  );
}
