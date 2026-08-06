"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { EventContest, EventEdition } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { CONTEST_CATEGORY_LABELS } from "@/lib/constants/agustusan";
import { groupContestsByDay } from "@/lib/agustusan";
import { LoadingSpinner } from "@/components/ui/Loading";

export default function LombaListPage() {
  const params = useParams();
  const year = Number(params.year);
  const supabase = useMemo(() => createClient(), []);
  const [edition, setEdition] = useState<EventEdition | null>(null);
  const [contests, setContests] = useState<EventContest[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
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

      const { data: contestRows } = await supabase
        .from("event_contests")
        .select("*")
        .eq("edition_id", editionRow.id)
        .order("sort_order");

      const list = (contestRows ?? []) as EventContest[];
      setContests(list);

      if (list.length > 0) {
        const { data: entries } = await supabase
          .from("event_contest_entries")
          .select("contest_id")
          .eq("status", "registered")
          .in(
            "contest_id",
            list.map((c) => c.id)
          );
        const map: Record<string, number> = {};
        (entries ?? []).forEach((e: { contest_id: string }) => {
          map[e.contest_id] = (map[e.contest_id] ?? 0) + 1;
        });
        setCounts(map);
      }
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

  const days = groupContestsByDay(contests);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/kegiatan/agustusan/${year}`}
          className="text-sm text-slate-500 hover:text-accent"
        >
          ← {edition.title}
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold text-slate-900">Daftar Lomba</h1>
        <p className="mt-1 text-sm text-slate-600">
          Pilih lomba untuk melihat aturan, peserta, dan mendaftar.
          {edition.registration_closes_at && (
            <> Batas daftar: {formatDateTime(edition.registration_closes_at)}.</>
          )}
        </p>
      </div>

      {days.map((day) => (
        <section key={day.key} className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-[#7a1218]">{day.label}</h2>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {day.contests.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/kegiatan/agustusan/${year}/lomba/${c.id}`}
                  className="flex flex-col gap-1 px-4 py-3.5 transition hover:bg-[#faf7f0] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-xs text-slate-500">
                      {CONTEST_CATEGORY_LABELS[c.category] ?? c.category}
                      {!c.is_competition && " · Acara"}
                    </p>
                    <p className="font-medium text-slate-900">{c.title}</p>
                    {c.category_note && (
                      <p className="mt-0.5 text-xs text-slate-500">{c.category_note}</p>
                    )}
                  </div>
                  <div className="text-left text-xs text-slate-500 sm:text-right">
                    {c.location && <p>{c.location}</p>}
                    {c.starts_at && <p>{formatDateTime(c.starts_at)}</p>}
                    {c.is_competition && (
                      <p className="mt-0.5 font-medium text-[#9a7b2e]">
                        {counts[c.id] ?? 0} peserta
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
