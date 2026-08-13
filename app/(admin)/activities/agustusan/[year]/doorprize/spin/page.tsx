"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type {
  EventDoorPrize,
  EventEdition,
  EventPeakRegistration,
} from "@/lib/types";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";
import { LoadingSpinner } from "@/components/ui/Loading";

type SpinResult = {
  winner: { id: string; registration_id: string; prize_id: string; selected_at: string };
  registration: EventPeakRegistration;
  prize: EventDoorPrize;
};

export default function DoorPrizeSpinPage() {
  const params = useParams();
  const year = Number(params.year);
  const supabase = useMemo(() => createClient(), []);
  const [edition, setEdition] = useState<EventEdition | null>(null);
  const [prizes, setPrizes] = useState<EventDoorPrize[]>([]);
  const [eligible, setEligible] = useState<EventPeakRegistration[]>([]);
  const [prizeId, setPrizeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [displayLabel, setDisplayLabel] = useState("—");
  const [result, setResult] = useState<SpinResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: ed } = await supabase
      .from("event_editions")
      .select("*")
      .eq("year", year)
      .maybeSingle();
    const editionRow = (ed as EventEdition) ?? null;
    setEdition(editionRow);
    if (!editionRow) {
      setLoading(false);
      return;
    }
    const [prizeRes, regRes, winRes] = await Promise.all([
      supabase
        .from("event_door_prizes")
        .select("*")
        .eq("edition_id", editionRow.id)
        .eq("is_active", true)
        .eq("kind", "door")
        .order("sort_order"),
      supabase
        .from("event_peak_registrations")
        .select("*")
        .eq("edition_id", editionRow.id)
        .eq("status", "verified"),
      supabase
        .from("event_door_prize_winners")
        .select("registration_id")
        .eq("edition_id", editionRow.id),
    ]);
    const prizeRows = (prizeRes.data ?? []) as EventDoorPrize[];
    setPrizes(prizeRows);
    setPrizeId((prev) => prev || prizeRows[0]?.id || "");
    const won = new Set(
      ((winRes.data ?? []) as { registration_id: string }[]).map((w) => w.registration_id)
    );
    setEligible(
      ((regRes.data ?? []) as EventPeakRegistration[]).filter(
        (r) => r.twibbon_url && !won.has(r.id)
      )
    );
    setLoading(false);
  }, [supabase, year]);

  useEffect(() => {
    load();
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  async function notifyWinner(registrationId: string, yearNum: number) {
    try {
      await fetch("/api/agustusan/doorprize/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, year: yearNum }),
      });
    } catch {
      /* non-blocking */
    }
  }

  async function spin() {
    setError(null);
    setResult(null);
    if (!prizeId) {
      setError("Pilih hadiah terlebih dahulu.");
      return;
    }
    if (eligible.length === 0) {
      setError("Tidak ada peserta eligible.");
      return;
    }
    setSpinning(true);
    let i = 0;
    timerRef.current = window.setInterval(() => {
      const pool = eligible;
      if (pool.length === 0) return;
      const row = pool[i % pool.length];
      setDisplayLabel(row.household_label);
      i += 1;
    }, 80);

    const { data, error: rpcError } = await supabase.rpc("spin_door_prize", {
      p_prize_id: prizeId,
    });

    await new Promise((r) => setTimeout(r, 2200));
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (rpcError) {
      setSpinning(false);
      setError(getSupabaseErrorMessage(rpcError) ?? "Spin gagal.");
      setDisplayLabel("—");
      return;
    }

    const payload = data as SpinResult;
    setResult(payload);
    setDisplayLabel(payload.registration.household_label);
    setSpinning(false);
    void notifyWinner(payload.registration.id, year);
    await load();
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
        <h1 className="mt-1 font-display text-3xl font-bold tracking-wide text-[#7a1218]">
          DOOR PRIZE
        </h1>
        <p className="text-sm text-slate-600">
          Eligible: {eligible.length} peserta · undian ditentukan server
        </p>
      </div>

      <div className="card space-y-4">
        <label className="label" htmlFor="prize">
          Pilih hadiah
        </label>
        <select
          id="prize"
          className="input max-w-md"
          value={prizeId}
          onChange={(e) => setPrizeId(e.target.value)}
          disabled={spinning}
        >
          {prizes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (kuota {p.quantity})
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#7a1218] via-[#9b1b23] to-[#5c0e12] px-6 py-16 text-center text-white shadow-xl">
        <p className="text-sm tracking-[0.35em] text-[#f0d78c] uppercase">Mengundi</p>
        <p className="mt-6 font-display text-5xl font-bold tabular-nums sm:text-7xl">
          {displayLabel}
        </p>
        {result && !spinning && (
          <div className="mx-auto mt-10 max-w-lg rounded-2xl bg-white/10 px-6 py-5 backdrop-blur">
            <p className="text-2xl font-bold text-[#f0d78c]">SELAMAT!</p>
            <p className="mt-2 text-lg">
              Blok {result.registration.blok_row} — Rumah{" "}
              {String(result.registration.nomor_kavling).padStart(2, "0")}
            </p>
            <p className="mt-1 text-xl font-semibold">
              Nama: {result.registration.participant_name}
            </p>
            <p className="mt-2 text-sm text-white/80">Hadiah: {result.prize.name}</p>
          </div>
        )}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            className="inline-flex items-center rounded-xl bg-[#c9a84c] px-8 py-3 text-base font-semibold text-white hover:bg-[#b8963f] disabled:opacity-60"
            disabled={spinning || !prizeId}
            onClick={spin}
          >
            {spinning ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Spinning...
              </>
            ) : result ? (
              "Spin Lagi"
            ) : (
              "Spin"
            )}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}
    </div>
  );
}
