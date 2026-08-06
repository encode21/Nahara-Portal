"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { EventContest, EventContestResult, EventEdition } from "@/lib/types";
import { CONTEST_CATEGORY_LABELS } from "@/lib/constants/agustusan";
import { LoadingSpinner } from "@/components/ui/Loading";

type ResultRow = EventContestResult & { contest?: EventContest | null };

export default function JuaraPage() {
  const params = useParams();
  const year = Number(params.year);
  const supabase = useMemo(() => createClient(), []);
  const [edition, setEdition] = useState<EventEdition | null>(null);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: ed } = await supabase
        .from("event_editions")
        .select("*")
        .eq("year", year)
        .maybeSingle();
      const editionRow = (ed ?? null) as EventEdition | null;
      setEdition(editionRow);
      if (!editionRow) {
        setLoading(false);
        return;
      }

      const { data: contests } = await supabase
        .from("event_contests")
        .select("*")
        .eq("edition_id", editionRow.id);

      const contestList = (contests ?? []) as EventContest[];
      const contestMap = Object.fromEntries(contestList.map((c) => [c.id, c]));

      if (contestList.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }

      const { data: rows } = await supabase
        .from("event_contest_results")
        .select("*")
        .eq("published", true)
        .in(
          "contest_id",
          contestList.map((c) => c.id)
        )
        .order("rank");

      setResults(
        ((rows ?? []) as EventContestResult[]).map((r) => ({
          ...r,
          contest: contestMap[r.contest_id] ?? null,
        }))
      );
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

  const byContest = new Map<string, ResultRow[]>();
  for (const r of results) {
    const list = byContest.get(r.contest_id) ?? [];
    list.push(r);
    byContest.set(r.contest_id, list);
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/kegiatan/agustusan/${year}`}
          className="text-sm text-slate-500 hover:text-accent"
        >
          ← {edition.title}
        </Link>
        <h1 className="mt-2 flex items-center gap-2 font-display text-3xl font-bold text-slate-900">
          <Trophy className="h-7 w-7 text-[#c9a84c]" />
          Juara & Hadiah
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Pengumuman resmi pemenang lomba HUT RI Cluster Nahara.
        </p>
      </div>

      {byContest.size === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 px-6 py-12 text-center text-sm text-slate-500">
          Belum ada juara yang dipublikasikan. Panitia akan mengumumkan setelah lomba selesai.
        </div>
      ) : (
        Array.from(byContest.entries()).map(([contestId, rows]) => {
          const contest = rows[0]?.contest;
          return (
            <section key={contestId} className="space-y-3">
              <div>
                <p className="text-xs text-slate-500">
                  {contest
                    ? CONTEST_CATEGORY_LABELS[contest.category] ?? contest.category
                    : ""}
                </p>
                <h2 className="font-display text-xl font-semibold text-slate-900">
                  {contest?.title ?? "Lomba"}
                </h2>
              </div>
              <ol className="space-y-2">
                {rows
                  .sort((a, b) => a.rank - b.rank)
                  .map((r) => (
                    <li
                      key={r.id}
                      className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 py-3"
                    >
                      <div>
                        <span className="mr-3 font-display text-lg font-bold text-[#7a1218]">
                          #{r.rank}
                        </span>
                        <span className="font-medium text-slate-900">{r.winner_label}</span>
                      </div>
                      {r.prize && (
                        <span className="text-sm text-[#9a7b2e]">{r.prize}</span>
                      )}
                    </li>
                  ))}
              </ol>
            </section>
          );
        })
      )}
    </div>
  );
}
