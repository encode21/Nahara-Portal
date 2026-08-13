"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, Copy, HelpCircle, Loader2, Volume2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";
import type { DuckRaceParticipant, EventDuckRace, EventEdition } from "@/lib/types";
import {
  buildDuckMotionProfiles,
  buildDuckRaceWhatsAppText,
  formatDuckRaceWhen,
  formatDuckRaceWinnerHouse,
  normalizeDuckRace,
  sampleDuckProgress,
} from "@/lib/agustusan/duck-race";
import {
  playSpinStart,
  playSpinTick,
  playWinnerFanfare,
  unlockAudio,
} from "@/lib/agustusan/doorprize-fx";
import { DoorPrizeConfetti } from "@/components/agustusan/DoorPrizeConfetti";
import { DuckRaceTrack } from "@/components/agustusan/DuckRaceTrack";
import { DuckRaceFairnessModal } from "@/components/agustusan/DuckRaceFairnessModal";
import { LoadingSpinner } from "@/components/ui/Loading";

type Phase = "ready" | "preparing" | "countdown" | "racing" | "finished";

const RACE_MS = 15_000;
const COUNTDOWN_STEPS = ["3", "2", "1", "GO!"] as const;

type Props = {
  year: number;
  /** Compact chrome for embedding under admin shell */
  variant?: "stage" | "admin-preview";
};

export function DuckRaceStage({ year, variant = "stage" }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const { isAdmin, loading: authLoading } = useAuth();
  const [edition, setEdition] = useState<EventEdition | null>(null);
  const [preview, setPreview] = useState<DuckRaceParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("ready");
  const [countdownLabel, setCountdownLabel] = useState<string | null>(null);
  const [race, setRace] = useState<EventDuckRace | null>(null);
  const [progress, setProgress] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [excludePrev, setExcludePrev] = useState(false);
  const [fairnessOpen, setFairnessOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const rafRef = useRef<number | null>(null);
  const cancelRef = useRef(false);

  const participants: DuckRaceParticipant[] =
    race?.participant_snapshot?.length ? race.participant_snapshot : preview;

  const loadPreview = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: ed, error: edErr } = await supabase
      .from("event_editions")
      .select("*")
      .eq("year", year)
      .maybeSingle();
    if (edErr || !ed) {
      setEdition(null);
      setPreview([]);
      setLoading(false);
      if (edErr) setError(getSupabaseErrorMessage(edErr) ?? "Gagal memuat edisi.");
      return;
    }
    const editionRow = ed as EventEdition;
    setEdition(editionRow);

    const { data: list, error: listErr } = await supabase.rpc(
      "list_duck_race_participants",
      { p_edition_id: editionRow.id }
    );
    if (listErr) {
      // Fallback: distinct households from registrations (verified + twibbon)
      const { data: regs } = await supabase
        .from("event_peak_registrations")
        .select("household_label, blok_row, nomor_kavling, status, twibbon_url")
        .eq("edition_id", editionRow.id)
        .eq("status", "verified");
      const map = new Map<string, DuckRaceParticipant>();
      for (const r of regs ?? []) {
        const row = r as {
          household_label: string;
          blok_row: string;
          nomor_kavling: number;
          twibbon_url: string | null;
        };
        if (!row.twibbon_url?.trim()) continue;
        if (!map.has(row.household_label)) {
          map.set(row.household_label, {
            household_label: row.household_label,
            blok_row: row.blok_row,
            nomor_kavling: row.nomor_kavling,
          });
        }
      }
      setPreview(
        Array.from(map.values()).sort((a, b) =>
          a.household_label.localeCompare(b.household_label, "id")
        )
      );
    } else {
      setPreview(
        Array.isArray(list)
          ? (list as DuckRaceParticipant[]).map((p) => ({
              household_label: p.household_label,
              blok_row: p.blok_row,
              nomor_kavling: Number(p.nomor_kavling),
            }))
          : []
      );
    }
    setLoading(false);
  }, [supabase, year]);

  useEffect(() => {
    void loadPreview();
    return () => {
      cancelRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [loadPreview]);

  useEffect(() => {
    if (phase === "ready" && !race) {
      setProgress(preview.map(() => 0));
    }
  }, [preview, phase, race]);

  function stopRaf() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }

  async function finishOnServer(raceId: string) {
    const { data, error: finErr } = await supabase.rpc("finish_duck_race", {
      p_race_id: raceId,
    });
    if (!finErr && data) {
      setRace(normalizeDuckRace(data as EventDuckRace));
    }
  }

  function runAnimation(activeRace: EventDuckRace) {
    const labels = activeRace.participant_snapshot.map((p) => p.household_label);
    const winner = activeRace.winner_household_label ?? labels[0] ?? "";
    const seed =
      activeRace.random_result?.winner_index != null
        ? activeRace.random_result.winner_index * 17 + labels.length
        : labels.length * 31;
    const profiles = buildDuckMotionProfiles(labels, winner, seed);
    const finals = profiles.map(
      (p) => p.positions[p.positions.length - 1] ?? 0
    );
    const start = performance.now();
    setPhase("racing");

    const tick = (now: number) => {
      if (cancelRef.current) return;
      const t = Math.min(1, (now - start) / RACE_MS);
      setProgress(profiles.map((profile) => sampleDuckProgress(t, profile)));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setProgress(finals);
        setPhase("finished");
        setBurstKey((k) => k + 1);
        if (soundOn) playWinnerFanfare();
        void finishOnServer(activeRace.id);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  async function startRace() {
    if (!edition || !isAdmin) return;
    unlockAudio();
    cancelRef.current = false;
    setError(null);
    setPhase("preparing");
    if (soundOn) playSpinStart();

    const { data, error: startErr } = await supabase.rpc("start_duck_race", {
      p_edition_id: edition.id,
      p_exclude_previous_winners: excludePrev,
    });

    if (startErr || !data) {
      setPhase("ready");
      setError(
        getSupabaseErrorMessage(startErr) ?? "Gagal memulai Duck Race."
      );
      return;
    }

    const active = normalizeDuckRace(data as EventDuckRace);
    setRace(active);
    setProgress(active.participant_snapshot.map(() => 0));

    setPhase("countdown");
    for (let i = 0; i < COUNTDOWN_STEPS.length; i += 1) {
      if (cancelRef.current) return;
      setCountdownLabel(COUNTDOWN_STEPS[i]);
      if (soundOn) playSpinTick(1 - i * 0.15);
      await new Promise<void>((r) => window.setTimeout(r, i === 3 ? 700 : 900));
    }
    setCountdownLabel(null);
    runAnimation(active);
  }

  function resetForNext() {
    stopRaf();
    cancelRef.current = false;
    setRace(null);
    setPhase("ready");
    setCountdownLabel(null);
    setProgress(preview.map(() => 0));
    void loadPreview();
  }

  async function copyWhatsApp() {
    if (!race) return;
    await navigator.clipboard.writeText(buildDuckRaceWhatsAppText(race));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  const busy = phase === "preparing" || phase === "countdown" || phase === "racing";
  const isStage = variant === "stage";

  if (loading || authLoading) {
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
    <div
      className={
        isStage
          ? "relative flex min-h-[calc(100vh-4rem)] flex-col bg-[#1a0508] text-white"
          : "relative flex min-h-[70vh] flex-col overflow-hidden rounded-2xl bg-[#1a0508] text-white ring-1 ring-slate-200"
      }
    >
      <DoorPrizeConfetti burstKey={burstKey} />

      <header className="relative z-10 shrink-0 border-b border-white/10 px-4 py-4 text-center sm:px-6">
        <p className="font-display text-xl font-bold tracking-wide sm:text-3xl">
          🇮🇩 NAHARA 81 TAHUN INDONESIA
        </p>
        <p className="mt-1 text-sm tracking-[0.25em] text-[#f0d78c] uppercase sm:text-base">
          HADIAH UTAMA
        </p>
        <p className="mt-1 font-display text-2xl font-bold text-white sm:text-4xl">
          🦆 DUCK RACE
        </p>
        {isStage && (
          <Link
            href={`/kegiatan/agustusan/${year}`}
            className="mt-2 inline-block text-xs text-white/50 hover:text-white/80"
          >
            Kembali
          </Link>
        )}
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
        <DuckRaceTrack
          participants={participants}
          progress={
            progress.length === participants.length
              ? progress
              : participants.map(() => 0)
          }
          winnerLabel={race?.winner_household_label ?? null}
          racing={phase === "racing"}
          finished={phase === "finished"}
        />

        {/* Countdown overlay */}
        {countdownLabel && (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black/40">
            <p className="font-display text-7xl font-bold text-[#f0d78c] drop-shadow-lg sm:text-9xl">
              {countdownLabel}
            </p>
          </div>
        )}

        {/* Winner reveal */}
        {phase === "finished" && race?.winner_household_label && (
          <div className="absolute inset-x-0 bottom-24 z-20 mx-auto max-w-lg px-4 sm:bottom-28">
            <div className="rounded-2xl bg-gradient-to-br from-[#7a1218]/95 via-[#9b1b23]/95 to-[#5c0e12]/95 px-6 py-6 text-center shadow-2xl ring-2 ring-[#f0d78c]/60 backdrop-blur">
              <p className="text-sm tracking-[0.3em] text-[#f0d78c] uppercase">
                🏁 FINISH!
              </p>
              <p className="mt-2 font-display text-2xl font-bold sm:text-3xl">
                🎉 SELAMAT! 🎉
              </p>
              <p className="mt-1 text-xs tracking-widest text-white/70 uppercase">
                HADIAH UTAMA
              </p>
              <p className="mt-3 font-display text-4xl font-bold tabular-nums text-[#f0d78c] sm:text-5xl">
                🏆 {race.winner_household_label}
              </p>
              <p className="mt-2 text-sm text-white/90 sm:text-base">
                {formatDuckRaceWinnerHouse(race)}
              </p>
              <p className="mt-3 text-xs text-white/50">
                {race.race_code} · {race.participant_count} rumah
              </p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="relative z-10 shrink-0 space-y-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-white/80">
              Peserta:{" "}
              <span className="text-xl font-bold text-[#f0d78c]">
                {participants.length}
              </span>{" "}
              rumah
              {race?.race_code && (
                <span className="ml-2 font-mono text-xs text-white/50">
                  {race.race_code}
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`inline-flex items-center rounded-lg bg-white/10 px-3 py-1.5 text-xs ${
                  soundOn ? "" : "opacity-50"
                }`}
                onClick={() => {
                  unlockAudio();
                  setSoundOn((v) => !v);
                }}
              >
                <Volume2 className="mr-1 h-3.5 w-3.5" />
                Sound {soundOn ? "On" : "Off"}
              </button>
              <button
                type="button"
                className="inline-flex items-center rounded-lg bg-white/10 px-3 py-1.5 text-xs"
                onClick={() => setFairnessOpen(true)}
              >
                <HelpCircle className="mr-1 h-3.5 w-3.5" />
                Bagaimana pemenang ditentukan?
              </button>
            </div>
          </div>

          {isAdmin ? (
            <>
              {phase === "ready" && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-2 text-xs text-white/70">
                    <input
                      type="checkbox"
                      checked={excludePrev}
                      onChange={(e) => setExcludePrev(e.target.checked)}
                      className="rounded border-white/30"
                    />
                    Keluarkan pemenang race sebelumnya
                  </label>
                  <p className="text-xs text-white/60 sm:text-right">
                    Pastikan daftar peserta sudah benar.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {phase === "ready" && (
                  <button
                    type="button"
                    className="inline-flex items-center rounded-xl bg-[#c9a84c] px-8 py-3 text-sm font-semibold text-[#1a0508] shadow-lg transition hover:bg-[#f0d78c] disabled:opacity-50"
                    disabled={busy || participants.length === 0}
                    onClick={() => void startRace()}
                  >
                    MULAI DUCK RACE
                  </button>
                )}

                {phase === "preparing" && (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center rounded-xl bg-[#c9a84c]/60 px-8 py-3 text-sm font-semibold text-[#1a0508]"
                  >
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyiapkan…
                  </button>
                )}

                {phase === "finished" && race && (
                  <>
                    <span className="inline-flex items-center rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-[#f0d78c]">
                      🏆 RACE SELESAI — {race.winner_household_label}
                    </span>
                    <button
                      type="button"
                      className="inline-flex items-center rounded-xl bg-white/15 px-4 py-2 text-sm"
                      onClick={() => void copyWhatsApp()}
                    >
                      {copied ? (
                        <Check className="mr-1.5 h-4 w-4" />
                      ) : (
                        <Copy className="mr-1.5 h-4 w-4" />
                      )}
                      Copy ke WhatsApp
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center rounded-xl bg-[#c9a84c] px-4 py-2 text-sm font-semibold text-[#1a0508]"
                      onClick={resetForNext}
                    >
                      Race Lagi
                    </button>
                  </>
                )}
              </div>

              {phase === "finished" && race && (
                <p className="text-xs text-white/50">
                  {formatDuckRaceWhen(race.finished_at ?? race.started_at)} · undian
                  acak oleh sistem
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-white/50">
              Mode penonton — kontrol race hanya untuk admin yang login.
            </p>
          )}

          {error && (
            <p className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}
        </div>
      </div>

      <DuckRaceFairnessModal
        open={fairnessOpen}
        onClose={() => setFairnessOpen(false)}
      />
    </div>
  );
}
