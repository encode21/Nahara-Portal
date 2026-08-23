"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/utils";
import type { EventEditionFeedback } from "@/lib/types";

export type PublicEditionFeedback = Pick<
  EventEditionFeedback,
  "id" | "edition_id" | "rating" | "body" | "display_name" | "created_at"
>;

type Props = {
  editionId: string;
  /** Ubah nilai ini untuk memuat ulang daftar setelah submit. */
  refreshKey?: number;
  limit?: number;
  compact?: boolean;
};

export function AgustusanFeedbackList({
  editionId,
  refreshKey = 0,
  limit = 40,
  compact,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<PublicEditionFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("event_edition_feedback")
      .select("id, edition_id, rating, body, display_name, created_at")
      .eq("edition_id", editionId)
      .order("created_at", { ascending: false })
      .limit(limit);
    setRows((data ?? []) as PublicEditionFeedback[]);
    setLoading(false);
  }, [supabase, editionId, limit]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const avg =
    rows.length > 0
      ? rows.reduce((sum, r) => sum + r.rating, 0) / rows.length
      : null;

  if (loading && rows.length === 0) {
    return (
      <p className="text-sm text-slate-500">Memuat masukan warga…</p>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Belum ada review. Jadilah yang pertama mengusulkan perbaikan atau lomba tahun depan.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {avg != null && (
        <div
          className={
            compact
              ? "flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
              : "rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm"
          }
        >
          <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {avg.toFixed(1)}
          </span>
          <span className="text-slate-500">/ 5 rata-rata</span>
          <span className="text-slate-400">· {rows.length} masukan</span>
        </div>
      )}
      <ul
        className={
          compact
            ? "divide-y divide-slate-100"
            : "divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white"
        }
      >
        {rows.map((row) => (
          <li key={row.id} className={compact ? "py-3 first:pt-0" : "space-y-1.5 px-4 py-3.5"}>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-sm tracking-tight text-amber-500" aria-label={`${row.rating} bintang`}>
                {"★".repeat(row.rating)}
                <span className="text-slate-200">{"★".repeat(5 - row.rating)}</span>
              </span>
              <span className="text-sm font-medium text-slate-800">
                {row.display_name || "Anonim"}
              </span>
              <span className="text-xs text-slate-400">
                {formatDateTime(row.created_at)}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {row.body}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
