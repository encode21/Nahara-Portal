"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Images, Music2, Sparkles, Trophy, VolumeX } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CONTEST_CATEGORY_LABELS } from "@/lib/constants/agustusan";
import { peakRegistrationsToGalleryItems } from "@/lib/agustusan/gallery";
import { formatDuckRaceWinnerHouse } from "@/lib/agustusan/duck-race";
import { PEAK_REGISTRATION_PUBLIC_COLUMNS } from "@/lib/agustusan-peak";
import type {
  EventContest,
  EventContestResult,
  EventDoorPrize,
  EventDoorPrizeWinner,
  EventDuckRace,
  EventEdition,
  EventPeakRegistration,
} from "@/lib/types";
import { LoadingSpinner } from "@/components/ui/Loading";
import { StoredImage } from "@/components/ui/StoredImage";
import { RecapConfetti } from "@/components/agustusan/RecapConfetti";
import { DoorPrizeConfetti } from "@/components/agustusan/DoorPrizeConfetti";

type DoorWinner = EventDoorPrizeWinner & {
  prize?: EventDoorPrize | null;
  registration?: EventPeakRegistration | null;
};

type ResultRow = EventContestResult & { contest?: EventContest | null };

type Polaroid = {
  id: string;
  src: string;
  caption: string;
};

/** Backsound halaman kenangan — file lokal (honk! / no na). */
const RECAP_BGM_SRC = "/assets/agustusan/kenangan-bgm.m4a";

function RecapBacksound() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const sync = () => setPlaying(!audio.paused);
    audio.addEventListener("play", sync);
    audio.addEventListener("pause", sync);
    audio.addEventListener("ended", sync);

    const tryPlay = () => {
      const p = audio.play();
      if (p) void p.catch(() => setPlaying(false));
    };

    tryPlay();

    const onGesture = () => {
      if (audio.paused) tryPlay();
    };
    window.addEventListener("pointerdown", onGesture, { passive: true });
    window.addEventListener("keydown", onGesture);

    return () => {
      audio.removeEventListener("play", sync);
      audio.removeEventListener("pause", sync);
      audio.removeEventListener("ended", sync);
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
    };
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }

  return (
    <>
      <audio ref={audioRef} src={RECAP_BGM_SRC} loop preload="auto" playsInline autoPlay />
      <button
        type="button"
        onClick={toggle}
        className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-4 z-[60] inline-flex items-center gap-2 rounded-full bg-[#1a0508]/90 px-4 py-2.5 text-sm font-medium text-white shadow-lg ring-1 ring-white/20 backdrop-blur hover:bg-[#7a1218]"
        aria-pressed={playing}
      >
        {playing ? (
          <>
            <VolumeX className="h-4 w-4" />
            Matikan lagu
          </>
        ) : (
          <>
            <Music2 className="h-4 w-4" />
            Putar lagu
          </>
        )}
      </button>
    </>
  );
}

function RecapImg({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  if (src.startsWith("/")) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className ?? "object-cover"}
        sizes="(max-width: 768px) 80vw, 360px"
      />
    );
  }
  return <StoredImage src={src} alt={alt} className={className ?? "h-full w-full object-cover"} />;
}

function RecapPolaroid({
  photo,
  rotate,
  delayMs,
}: {
  photo: Polaroid;
  rotate: number;
  delayMs: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setShown(true);
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <figure
      ref={ref}
      className={`transition duration-700 ease-out ${
        shown ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      }`}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      <div
        className="bg-white p-2 pb-8 shadow-[0_12px_30px_rgba(26,5,8,0.18)] ring-1 ring-black/5"
        style={{ transform: `rotate(${rotate}deg)` }}
      >
        <div className="relative aspect-square overflow-hidden bg-slate-100">
          <RecapImg src={photo.src} alt={photo.caption} />
        </div>
        <figcaption className="mt-3 px-1 text-center text-xs font-medium text-slate-700">
          {photo.caption}
        </figcaption>
      </div>
    </figure>
  );
}

function rankTone(rank: number) {
  if (rank === 1) return "bg-[#c9a84c] text-[#1a0508]";
  if (rank === 2) return "bg-slate-300 text-slate-800";
  if (rank === 3) return "bg-[#c08457] text-white";
  return "bg-slate-100 text-slate-600";
}

export function AgustusanRecap({ year }: { year: number }) {
  const supabase = useMemo(() => createClient(), []);
  const [edition, setEdition] = useState<EventEdition | null>(null);
  const [doorWinners, setDoorWinners] = useState<DoorWinner[]>([]);
  const [races, setRaces] = useState<EventDuckRace[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [regPhotos, setRegPhotos] = useState<Polaroid[]>([]);
  const [regCount, setRegCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [burstKey, setBurstKey] = useState(0);
  const prizeSectionRef = useRef<HTMLElement>(null);

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

      const [winnersRes, racesRes, contestsRes, regsRes] = await Promise.all([
        supabase
          .from("event_door_prize_winners")
          .select(
            `*, prize:event_door_prizes(*), registration:event_peak_registrations(${PEAK_REGISTRATION_PUBLIC_COLUMNS})`
          )
          .eq("edition_id", editionRow.id)
          .order("selected_at"),
        supabase
          .from("event_duck_races")
          .select("*")
          .eq("edition_id", editionRow.id)
          .eq("status", "finished")
          .order("created_at"),
        supabase
          .from("event_contests")
          .select("*")
          .eq("edition_id", editionRow.id)
          .order("sort_order"),
        supabase
          .from("event_peak_registrations")
          .select(PEAK_REGISTRATION_PUBLIC_COLUMNS)
          .eq("edition_id", editionRow.id)
          .neq("status", "cancelled")
          .order("created_at", { ascending: false }),
      ]);

      const contestList = (contestsRes.data ?? []) as EventContest[];
      const contestMap = Object.fromEntries(contestList.map((c) => [c.id, c]));
      if (contestList.length > 0) {
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
      }

      const regs = (regsRes.data ?? []) as EventPeakRegistration[];
      setRegCount(regs.length);
      setDoorWinners((winnersRes.data ?? []) as DoorWinner[]);
      setRaces((racesRes.data ?? []) as EventDuckRace[]);

      setRegPhotos(
        peakRegistrationsToGalleryItems(regs, editionRow.id).map((g) => ({
          id: g.id,
          src: g.image_url,
          caption: g.caption ?? "",
        }))
      );
      setLoading(false);
    }
    if (Number.isFinite(year)) void load();
  }, [supabase, year]);

  useEffect(() => {
    const el = prizeSectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setBurstKey((k) => (k === 0 ? 1 : k));
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loading]);

  const prizeGroups = useMemo(() => {
    const map = new Map<string, DoorWinner[]>();
    const order: string[] = [];
    for (const w of doorWinners) {
      const name = w.prize?.name ?? "Door Prize";
      if (!map.has(name)) {
        map.set(name, []);
        order.push(name);
      }
      map.get(name)!.push(w);
    }
    return order.map((name) => ({ name, winners: map.get(name)! }));
  }, [doorWinners]);

  const juaraGroups = useMemo(() => {
    const map = new Map<string, ResultRow[]>();
    const order: string[] = [];
    for (const r of results) {
      if (!map.has(r.contest_id)) {
        map.set(r.contest_id, []);
        order.push(r.contest_id);
      }
      map.get(r.contest_id)!.push(r);
    }
    return order.map((id) => ({
      contest: map.get(id)![0]?.contest,
      rows: map.get(id)!.slice().sort((a, b) => a.rank - b.rank),
    }));
  }, [results]);

  const marquee = regPhotos;
  const story = regPhotos;

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
    <div className="-mx-4 -mt-6 bg-[#1a0508] text-white lg:-mx-6 lg:-mt-8">
      <section className="relative overflow-hidden px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:pb-20">
        <RecapConfetti />
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #9b1b23 0 28%, transparent 29%), radial-gradient(circle at 85% 70%, #c9a84c 0 16%, transparent 17%)",
          }}
        />
        <div className="relative z-20 mx-auto max-w-3xl text-center">
          <Link
            href={`/kegiatan/agustusan/${year}`}
            className="text-xs text-white/60 hover:text-white"
          >
            ← {edition.title}
          </Link>
          <p className="mt-5 text-xs font-medium tracking-[0.35em] text-[#f0d78c] uppercase">
            Kenangan HUT ke-81 RI
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-6xl">
            Terima kasih,
            <br />
            Cluster Nahara
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm text-white/80 sm:text-base">
            Agustusan {year} sudah selesai. Ini rekap malam puncak, juara lomba, dan wajah-wajah
            yang hadir.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
            <span className="rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/15">
              {regCount} peserta malam puncak
            </span>
            <span className="rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/15">
              {doorWinners.length} pemenang door prize
            </span>
            <span className="rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/15">
              {results.length} juara lomba
            </span>
          </div>
        </div>
      </section>

      {marquee.length > 0 && (
        <div className="overflow-hidden border-y border-white/10 bg-black/30 py-3">
          <div className="flex w-max animate-recap-marquee gap-3">
            {[...marquee, ...marquee].map((p, i) => (
              <div
                key={`${p.id}-${i}`}
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/20 sm:h-24 sm:w-24"
              >
                <RecapImg src={p.src} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      <section
        ref={prizeSectionRef}
        className="relative mx-auto max-w-5xl space-y-8 px-4 py-16 sm:px-6"
      >
        <DoorPrizeConfetti burstKey={burstKey} />
        <div className="text-center">
          <p className="text-xs tracking-[0.3em] text-[#f0d78c] uppercase">Malam Puncak</p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Pemenang Door Prize</h2>
        </div>
        {prizeGroups.length === 0 ? (
          <p className="text-center text-sm text-white/60">Belum ada pemenang door prize.</p>
        ) : (
          prizeGroups.map((group) => (
            <div key={group.name} className="space-y-4">
              <h3 className="font-display text-xl font-semibold text-[#f0d78c]">{group.name}</h3>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.winners.map((w) => {
                  const reg = w.registration;
                  return (
                    <li
                      key={w.id}
                      className="overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10"
                    >
                      {reg?.twibbon_url ? (
                        <div className="relative aspect-square">
                          <RecapImg
                            src={reg.twibbon_url}
                            alt={reg.participant_name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : null}
                      <div className="p-4">
                        <p className="font-display text-lg font-bold">
                          {reg?.participant_name ?? "Peserta"}
                        </p>
                        <p className="text-sm text-white/70">{reg?.household_label}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </section>

      {races.length > 0 && (
        <section className="mx-auto max-w-5xl space-y-6 px-4 pb-16 sm:px-6">
          <div className="text-center">
            <p className="text-xs tracking-[0.3em] text-[#f0d78c] uppercase">Hadiah Utama</p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Duck Race</h2>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {races.map((race, i) => (
              <li
                key={race.id}
                className="rounded-2xl bg-gradient-to-br from-[#7a1218] to-[#9b1b23] p-5 ring-1 ring-[#f0d78c]/30"
              >
                <p className="text-xs tracking-widest text-[#f0d78c] uppercase">
                  Race {i + 1} · {race.participant_count} rumah
                </p>
                <p className="mt-2 font-display text-3xl font-bold text-[#f0d78c]">
                  {race.winner_household_label}
                </p>
                <p className="mt-1 text-sm text-white/80">{formatDuckRaceWinnerHouse(race)}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="bg-[#faf7f0] px-4 py-16 text-slate-900 sm:px-6">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="text-center">
            <p className="text-xs tracking-[0.3em] text-[#9a7b2e] uppercase">Lomba Cluster</p>
            <h2 className="mt-2 flex items-center justify-center gap-2 font-display text-3xl font-bold sm:text-4xl">
              <Trophy className="h-7 w-7 text-[#c9a84c]" />
              Juara
            </h2>
          </div>
          {juaraGroups.length === 0 ? (
            <p className="text-center text-sm text-slate-500">Belum ada juara yang dipublikasikan.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {juaraGroups.map(({ contest, rows }) => (
                <article
                  key={contest?.id ?? rows[0]?.id}
                  className="rounded-2xl bg-white p-5 ring-1 ring-slate-200"
                >
                  <p className="text-xs text-slate-500">
                    {contest
                      ? CONTEST_CATEGORY_LABELS[contest.category] ?? contest.category
                      : ""}
                  </p>
                  <h3 className="mt-1 font-display text-lg font-semibold">{contest?.title}</h3>
                  <ol className="mt-3 space-y-2">
                    {rows.map((r) => (
                      <li key={r.id} className="flex items-start justify-between gap-3">
                        <span
                          className={`mt-0.5 inline-flex min-w-8 shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${rankTone(r.rank)}`}
                        >
                          {r.rank}
                        </span>
                        <span className="flex-1 text-sm font-medium text-slate-900">
                          {r.winner_label}
                        </span>
                      </li>
                    ))}
                  </ol>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {story.length > 0 && (
        <section className="bg-[#f3ead6] px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center text-slate-900">
              <p className="text-xs tracking-[0.3em] text-[#9a7b2e] uppercase">
                Peserta registrasi malam puncak
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
                Wajah-wajah yang hadir
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {story.length} peserta · scroll pelan, fotonya muncul satu per satu.
              </p>
            </div>
            <div className="columns-2 gap-5 sm:columns-3 lg:columns-4">
              {story.map((photo, i) => (
                <div key={photo.id} className="mb-5 break-inside-avoid">
                  <RecapPolaroid
                    photo={photo}
                    rotate={[-7, -3, 2, 5, -5, 4, -2, 6][i % 8]}
                    delayMs={(i % 4) * 80}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="px-4 py-16 text-center sm:px-6">
        <Sparkles className="mx-auto h-8 w-8 text-[#f0d78c]" />
        <p className="mt-4 font-display text-2xl font-bold">Sampai ketemu Agustusan berikutnya.</p>
        <p className="mt-2 text-sm text-white/70">#HajatanNaharaMerdeka</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={`/kegiatan/agustusan/${year}/galeri`}
            className="inline-flex items-center rounded-lg bg-[#c9a84c] px-5 py-3 text-sm font-semibold text-[#1a0508] hover:bg-[#f0d78c]"
          >
            <Images className="mr-2 h-4 w-4" />
            Galeri lengkap
          </Link>
          <Link
            href={`/kegiatan/agustusan/${year}`}
            className="inline-flex items-center rounded-lg border border-white/30 px-5 py-3 text-sm font-medium text-white hover:bg-white/10"
          >
            Kembali ke hub
          </Link>
        </div>
      </section>
      <RecapBacksound />
    </div>
  );
}
