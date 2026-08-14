"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AGUSTUSAN_MEDIA,
  AGUSTUSAN_TITLE,
  PEAK_EVENT,
} from "@/lib/constants/agustusan";
import { MALAM_PUNCAK_ASSETS } from "@/lib/constants/agustusan-rundown";
import {
  createMalamPuncakChannel,
  readStoredCue,
  type MalamPuncakCue,
} from "@/lib/agustusan/malam-puncak-channel";

export function MalamPuncakStage({ year }: { year: number }) {
  const [armed, setArmed] = useState(false);
  const [cue, setCue] = useState<MalamPuncakCue>(() => readStoredCue(year));
  const [mediaError, setMediaError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const applyCue = useCallback((next: MalamPuncakCue) => {
    setCue(next);
    setMediaError(false);
  }, []);

  useEffect(() => {
    const channel = createMalamPuncakChannel(year, (msg) => {
      if (msg.type === "cue") applyCue(msg.cue);
    });
    channel?.postMessage({ type: "hello" });

    const ping = window.setInterval(() => {
      channel?.postMessage({ type: "pong", at: Date.now() });
    }, 2000);
    channel?.postMessage({ type: "pong", at: Date.now() });

    function onStorage(e: StorageEvent) {
      if (e.key !== `nahara:malam-puncak:${year}:cue` || !e.newValue) return;
      try {
        applyCue(JSON.parse(e.newValue) as MalamPuncakCue);
      } catch {
        /* ignore */
      }
    }
    window.addEventListener("storage", onStorage);

    return () => {
      window.clearInterval(ping);
      window.removeEventListener("storage", onStorage);
      channel?.close();
    };
  }, [year, applyCue]);

  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    video?.pause();
    audio?.pause();
    if (!armed) return;

    if (cue.mode === "video" && video && cue.src) {
      video.volume = cue.volume;
      if (cue.playing) {
        void video.play().catch(() => setMediaError(true));
      } else {
        video.pause();
      }
    }
    if (cue.mode === "audio" && audio && cue.src) {
      audio.volume = cue.volume;
      if (cue.playing) {
        void audio.play().catch(() => setMediaError(true));
      } else {
        audio.pause();
      }
    }
  }, [armed, cue]);

  const showVideo = cue.mode === "video" && Boolean(cue.src);
  const showAudio = cue.mode === "audio" && Boolean(cue.src);
  const showEmbed = cue.mode === "embed" && Boolean(cue.src);
  const missingSrc =
    (cue.mode === "video" || cue.mode === "audio" || cue.mode === "embed") &&
    !cue.src;

  const idleTitle = useMemo(
    () => cue.title || PEAK_EVENT.title,
    [cue.title],
  );

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-slate-950 text-white"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={AGUSTUSAN_MEDIA.hero}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <span className="relative z-10 rounded-full border border-white/20 bg-black/50 px-6 py-3 text-lg font-semibold">
          Siapkan layar
        </span>
        <span className="relative z-10 max-w-md px-6 text-center text-sm text-white/70">
          Klik sekali untuk mengizinkan autoplay. Lalu drag jendela ini ke
          projector.
        </span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black text-white">
      {showVideo && (
        <video
          ref={videoRef}
          key={cue.src ?? "video"}
          src={cue.src ?? undefined}
          className="h-full w-full object-contain"
          playsInline
          loop={cue.loop}
          onError={() => setMediaError(true)}
          onEnded={() => setMediaError(false)}
        />
      )}
      {showAudio && (
        <>
          <audio
            ref={audioRef}
            key={cue.src ?? "audio"}
            src={cue.src ?? undefined}
            onError={() => setMediaError(true)}
          />
          <div className="flex h-full flex-col items-center justify-center gap-6 bg-gradient-to-b from-[#3a0a0d] to-black">
            <p className="text-sm uppercase tracking-[0.3em] text-white/50">
              Audio
            </p>
            <p className="px-8 text-center font-display text-4xl font-bold md:text-6xl">
              {cue.title}
            </p>
            <div
              className={`h-3 w-40 rounded-full bg-[#7a1218] ${
                cue.playing ? "animate-pulse" : "opacity-40"
              }`}
            />
          </div>
        </>
      )}
      {showEmbed && (
        <>
          <iframe
            title={cue.title || "Embed"}
            src={cue.src ?? undefined}
            className="h-full w-full border-0"
            allow="autoplay; fullscreen; gamepad"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <a
            href={cue.src ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-4 right-4 rounded-lg bg-black/70 px-3 py-2 text-xs text-white/80 hover:bg-black/90"
          >
            Jika layar kosong, buka game di tab ini
          </a>
        </>
      )}
      {(cue.mode === "idle" || missingSrc) && !showVideo && !showAudio && !showEmbed && (
        <div className="relative flex h-full w-full items-end justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={MALAM_PUNCAK_ASSETS.idlePoster}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
          <div className="relative z-10 mb-16 px-8 text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-white/70">
              {AGUSTUSAN_TITLE}
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold md:text-6xl">
              {idleTitle}
            </h1>
            <p className="mt-3 text-lg text-white/80">{PEAK_EVENT.location}</p>
          </div>
        </div>
      )}
      {(mediaError || missingSrc) && cue.mode !== "idle" && (
        <div className="absolute inset-x-0 top-8 z-20 mx-auto max-w-lg rounded-xl bg-black/75 px-6 py-4 text-center text-sm">
          File belum ada atau gagal diputar
          {cue.src ? (
            <span className="mt-1 block break-all text-white/50">{cue.src}</span>
          ) : null}
        </div>
      )}
    </div>
  );
}
