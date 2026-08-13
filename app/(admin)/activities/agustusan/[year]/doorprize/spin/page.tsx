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
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href={`/activities/agustusan/${year}/doorprize`}
            className="text-sm text-slate-500 hover:text-[#7a1218]"
          >
            ← Door Prize
          </Link>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Door Prize Live
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {eligible.length} peserta eligible
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            id="prize"
            className="input min-w-[12rem] border-slate-200 bg-white py-2 text-sm"
            value={prizeId}
            onChange={(e) => setPrizeId(e.target.value)}
            disabled={spinning}
            aria-label="Pilih hadiah"
          >
            {prizes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · sisa kuota {p.quantity}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition ${
              soundOn
                ? "border-[#c9a84c]/40 bg-[#c9a84c]/10 text-[#7a1218]"
                : "border-slate-200 bg-white text-slate-500"
            }`}
            onClick={() => {
              unlockAudio();
              setSoundOn((v) => !v);
            }}
          >
            <Volume2 className="h-4 w-4" />
            {soundOn ? "On" : "Off"}
          </button>
        </div>
      </div>

      {/* Stage — one composition */}
      <section
        className={`relative isolate min-h-[70vh] overflow-hidden rounded-[2rem] text-white sm:min-h-[75vh] ${
          spinning ? "doorprize-stage-spin" : reveal ? "doorprize-stage-win" : "doorprize-stage-idle"
        }`}
      >
        <div className="doorprize-stage-mesh pointer-events-none absolute inset-0" aria-hidden />
        <div
          className={`doorprize-orb doorprize-orb-a pointer-events-none absolute -left-16 -top-20 h-72 w-72 rounded-full blur-3xl ${
            spinning ? "opacity-80" : "opacity-50"
          }`}
          aria-hidden
        />
        <div
          className={`doorprize-orb doorprize-orb-b pointer-events-none absolute -bottom-24 -right-10 h-80 w-80 rounded-full blur-3xl ${
            spinning ? "opacity-70" : "opacity-40"
          }`}
          aria-hidden
        />
        <DoorPrizeConfetti burstKey={burstKey} />

        <div className="relative z-10 flex min-h-[70vh] flex-col items-center justify-center px-5 py-12 sm:min-h-[75vh] sm:px-10">
          {!reveal || spinning ? (
            <>
              <p className="text-[11px] font-semibold tracking-[0.4em] text-white/55 uppercase">
                {spinning ? "Mengundi" : "Siap undi"}
              </p>
              <div
                className={`mt-8 text-center transition duration-150 ${
                  spinning && reelPulse ? "scale-[1.04] opacity-100" : "scale-100 opacity-95"
                }`}
              >
                <p className="font-display text-[clamp(3rem,12vw,7rem)] font-bold leading-none tracking-tight text-white drop-shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
                  {displayLabel}
                </p>
                {displayName ? (
                  <p className="mt-4 text-base text-white/55 sm:text-xl">{displayName}</p>
                ) : (
                  <p className="mt-4 text-base text-white/35 sm:text-lg">
                    Tekan spin untuk mengundi pemenang
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="doorprize-reveal mx-auto w-full max-w-2xl text-center">
              <p className="text-[11px] font-semibold tracking-[0.45em] text-[#f0d78c] uppercase">
                Selamat
              </p>
              <p className="mt-5 font-display text-[clamp(3.25rem,11vw,6.5rem)] font-bold leading-[0.95] tracking-tight text-white drop-shadow-[0_12px_50px_rgba(0,0,0,0.4)]">
                {result?.registration.household_label ?? displayLabel}
              </p>
              <p className="mt-5 text-xl font-medium text-white/90 sm:text-2xl">
                {result?.registration.participant_name ?? displayName}
              </p>
              {result?.prize.name && (
                <p className="mt-6 text-sm tracking-wide text-[#f0d78c]/90">
                  {result.prize.name}
                </p>
              )}
              <div className="mx-auto mt-8 h-px w-24 bg-gradient-to-r from-transparent via-[#f0d78c]/70 to-transparent" />
              <p className="mt-6 text-xs tracking-[0.2em] text-white/40 uppercase">
                Agustusan Nahara {year}
              </p>
            </div>
          )}

          <div className="mt-12">
            <button
              type="button"
              className="group relative inline-flex min-w-[10.5rem] items-center justify-center overflow-hidden rounded-full bg-white px-9 py-3.5 text-sm font-semibold text-[#7a1218] shadow-[0_10px_40px_rgba(0,0,0,0.25)] transition hover:scale-[1.03] hover:shadow-[0_14px_50px_rgba(201,168,76,0.35)] disabled:opacity-50"
              disabled={spinning || !prizeId}
              onClick={spin}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#f0d78c]/0 via-[#f0d78c]/35 to-[#f0d78c]/0 opacity-0 transition group-hover:opacity-100" />
              <span className="relative inline-flex items-center">
                {spinning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Spinning
                  </>
                ) : result ? (
                  "Spin Lagi"
                ) : (
                  "Spin"
                )}
              </span>
            </button>
          </div>
        </div>
      </section>

      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}
    </div>
  );
}
