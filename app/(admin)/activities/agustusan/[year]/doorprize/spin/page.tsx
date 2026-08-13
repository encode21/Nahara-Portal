"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, Volume2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type {
  EventDoorPrize,
  EventEdition,
  EventPeakRegistration,
} from "@/lib/types";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";
import { LoadingSpinner } from "@/components/ui/Loading";
import { DoorPrizeConfetti } from "@/components/agustusan/DoorPrizeConfetti";
import {
  playSpinStart,
  playSpinTick,
  playWinnerFanfare,
  unlockAudio,
} from "@/lib/agustusan/doorprize-fx";

type SpinResult = {
  winner: { id: string; registration_id: string; prize_id: string; selected_at: string };
  registration: EventPeakRegistration;
  prize: EventDoorPrize;
};

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

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
  const [displayName, setDisplayName] = useState("");
  const [result, setResult] = useState<SpinResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [burstKey, setBurstKey] = useState(0);
  const [reelPulse, setReelPulse] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const cancelRef = useRef(false);

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
      cancelRef.current = true;
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

  async function runReel(pool: EventPeakRegistration[], final: EventPeakRegistration) {
    const steps = 36;
    for (let i = 0; i < steps; i += 1) {
      if (cancelRef.current) return;
      const progress = i / steps;
      const delay = 45 + Math.pow(progress, 2.4) * 260;
      const row =
        i >= steps - 3
          ? final
          : pool[Math.floor(Math.random() * pool.length)] ?? final;
      setDisplayLabel(row.household_label);
      setDisplayName(row.participant_name);
      setReelPulse((p) => !p);
      if (soundOn) playSpinTick(1 - progress * 0.55);
      await sleep(delay);
    }
    setDisplayLabel(final.household_label);
    setDisplayName(final.participant_name);
  }

  async function spin() {
    unlockAudio();
    setError(null);
    setResult(null);
    setReveal(false);
    if (!prizeId) {
      setError("Pilih hadiah terlebih dahulu.");
      return;
    }
    if (eligible.length === 0) {
      setError("Tidak ada peserta eligible.");
      return;
    }

    cancelRef.current = false;
    setSpinning(true);
    if (soundOn) playSpinStart();

    const pool = eligible;
    let i = 0;
    const fastId = window.setInterval(() => {
      const row = pool[i % pool.length];
      setDisplayLabel(row.household_label);
      setDisplayName(row.participant_name);
      setReelPulse((p) => !p);
      if (soundOn) playSpinTick(1);
      i += 1;
    }, 55);

    const { data, error: rpcError } = await supabase.rpc("spin_door_prize", {
      p_prize_id: prizeId,
    });

    // Keep fast reel visible briefly for drama
    await sleep(900);
    window.clearInterval(fastId);

    if (rpcError) {
      setSpinning(false);
      setError(getSupabaseErrorMessage(rpcError) ?? "Spin gagal.");
      setDisplayLabel("—");
      setDisplayName("");
      return;
    }

    const payload = data as SpinResult;
    await runReel(pool, payload.registration);

    setResult(payload);
    setDisplayLabel(payload.registration.household_label);
    setDisplayName(payload.registration.participant_name);
    setSpinning(false);
    setReveal(true);
    setBurstKey((k) => k + 1);
    if (soundOn) playWinnerFanfare();
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
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
        <button
          type="button"
          className={`btn-secondary ${soundOn ? "" : "opacity-60"}`}
          onClick={() => {
            unlockAudio();
            setSoundOn((v) => !v);
          }}
        >
          <Volume2 className="mr-1.5 h-4 w-4" />
          Sound {soundOn ? "On" : "Off"}
        </button>
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

      <div
        className={`relative overflow-hidden rounded-3xl px-6 py-14 text-center text-white shadow-xl transition ${
          spinning
            ? "bg-gradient-to-br from-[#9b1b23] via-[#7a1218] to-[#3f0a0e] ring-4 ring-[#c9a84c]/50"
            : reveal
              ? "bg-gradient-to-br from-[#7a1218] via-[#9b1b23] to-[#c9a84c] ring-4 ring-[#f0d78c]/70"
              : "bg-gradient-to-br from-[#7a1218] via-[#9b1b23] to-[#5c0e12]"
        }`}
      >
        {/* festive backdrop */}
        <div
          className={`pointer-events-none absolute inset-0 opacity-30 ${
            spinning ? "animate-pulse" : ""
          }`}
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #f0d78c55, transparent 40%), radial-gradient(circle at 80% 30%, #ffffff33, transparent 35%), radial-gradient(circle at 50% 80%, #c9a84c44, transparent 45%)",
          }}
          aria-hidden
        />
        <DoorPrizeConfetti burstKey={burstKey} />

        <p className="relative z-10 text-sm tracking-[0.35em] text-[#f0d78c] uppercase">
          {spinning ? "Mengundi…" : reveal ? "Pemenang" : "Siap undi"}
        </p>

        <div
          className={`relative z-10 mx-auto mt-6 max-w-3xl rounded-2xl border-2 border-[#f0d78c]/40 bg-black/25 px-4 py-8 backdrop-blur-sm transition-transform duration-150 ${
            spinning && reelPulse ? "scale-[1.03]" : "scale-100"
          } ${reveal ? "animate-[bounce_0.6s_ease]" : ""}`}
        >
          <p
            className={`font-display font-bold tabular-nums tracking-wide transition-all duration-100 ${
              spinning ? "text-5xl sm:text-7xl text-white" : "text-5xl sm:text-7xl text-[#f0d78c]"
            }`}
          >
            {displayLabel}
          </p>
          {displayName && (
            <p
              className={`mt-3 text-lg sm:text-2xl ${
                spinning ? "text-white/70" : "text-white"
              }`}
            >
              {displayName}
            </p>
          )}
        </div>

        {result && !spinning && (
          <div className="relative z-10 mx-auto mt-10 max-w-lg rounded-2xl bg-white/15 px-6 py-6 shadow-lg ring-1 ring-[#f0d78c]/50 backdrop-blur">
            <p className="font-display text-3xl font-bold text-[#f0d78c] drop-shadow">
              SELAMAT!
            </p>
            <p className="mt-3 text-lg">
              Blok {result.registration.blok_row} — Rumah{" "}
              {String(result.registration.nomor_kavling).padStart(2, "0")}
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {result.registration.participant_name}
            </p>
            <p className="mt-3 inline-block rounded-full bg-[#c9a84c] px-4 py-1.5 text-sm font-semibold text-white">
              {result.prize.name}
            </p>
          </div>
        )}

        <div className="relative z-10 mt-10 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            className="inline-flex items-center rounded-xl bg-[#c9a84c] px-10 py-3.5 text-base font-semibold text-white shadow-lg shadow-black/20 transition hover:bg-[#b8963f] hover:scale-[1.02] disabled:opacity-60"
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
