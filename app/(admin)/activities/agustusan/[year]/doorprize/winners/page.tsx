"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type {
  EventDoorPrize,
  EventDoorPrizeWinner,
  EventEdition,
  EventPeakRegistration,
} from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/Loading";

type WinnerRow = EventDoorPrizeWinner & {
  prize?: EventDoorPrize | null;
  registration?: EventPeakRegistration | null;
};

export default function DoorPrizeWinnersPage() {
  const params = useParams();
  const year = Number(params.year);
  const supabase = useMemo(() => createClient(), []);
  const [edition, setEdition] = useState<EventEdition | null>(null);
  const [rows, setRows] = useState<WinnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
        .from("event_door_prize_winners")
        .select("*, prize:event_door_prizes(*), registration:event_peak_registrations(*)")
        .eq("edition_id", editionRow.id)
        .order("selected_at", { ascending: false });
      if (!cancelled) {
        setRows((data ?? []) as WinnerRow[]);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, year]);

  async function resetWinner(id: string) {
    setMessage(null);
    setResetting(id);
    const { error } = await supabase.from("event_door_prize_winners").delete().eq("id", id);
    setResetting(null);
    if (error) {
      setMessage(error.message);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    setMessage("Pemenang di-reset (boleh diundi lagi).");
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

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/activities/agustusan/${year}/doorprize`}
          className="text-sm text-slate-500 hover:underline"
        >
          ← Door Prize dashboard
        </Link>
        <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">
          Riwayat Pemenang
        </h1>
      </div>

      {message && (
        <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">{message}</p>
      )}

      <div className="card overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b text-slate-500">
            <tr>
              <th className="px-2 py-2 font-medium">Hadiah</th>
              <th className="px-2 py-2 font-medium">Pemenang</th>
              <th className="px-2 py-2 font-medium">Blok</th>
              <th className="px-2 py-2 font-medium">Rumah</th>
              <th className="px-2 py-2 font-medium">Waktu</th>
              <th className="px-2 py-2 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100">
                <td className="px-2 py-2">{r.prize?.name ?? "—"}</td>
                <td className="px-2 py-2 font-medium">
                  {r.registration?.participant_name ?? "—"}
                </td>
                <td className="px-2 py-2">{r.registration?.blok_row ?? "—"}</td>
                <td className="px-2 py-2">
                  {r.registration
                    ? String(r.registration.nomor_kavling).padStart(2, "0")
                    : "—"}
                </td>
                <td className="px-2 py-2">{formatDateTime(r.selected_at)}</td>
                <td className="px-2 py-2">
                  <button
                    type="button"
                    className="text-xs font-medium text-red-700 hover:underline"
                    disabled={resetting === r.id}
                    onClick={() => resetWinner(r.id)}
                  >
                    Reset
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-2 py-8 text-center text-slate-500">
                  Belum ada pemenang.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
