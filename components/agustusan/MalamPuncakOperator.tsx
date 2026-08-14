"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  MonitorUp,
  Pause,
  Play,
  Square,
  Volume2,
} from "lucide-react";
import { PEAK_EVENT } from "@/lib/constants/agustusan";
import {
  MALAM_PUNCAK_RUNDOWN,
  formatJakartaClock,
  isSlotCurrent,
  rundownShortcutHref,
  type RundownSlot,
} from "@/lib/constants/agustusan-rundown";
import {
  IDLE_CUE,
  createMalamPuncakChannel,
  postCue,
  readStoredCue,
  type MalamPuncakCue,
} from "@/lib/agustusan/malam-puncak-channel";

const STAGE_PING_MS = 4500;

function cueFromSlot(
  slot: RundownSlot,
  playing: boolean,
  volume: number,
): MalamPuncakCue {
  return {
    slotId: slot.id,
    mode: slot.cue.kind,
    src: slot.cue.src,
    title: slot.cue.label ?? slot.title,
    playing: playing && slot.cue.kind !== "idle",
    volume,
    at: Date.now(),
  };
}

export function MalamPuncakOperator({ year }: { year: number }) {
  const [clock, setClock] = useState(() => formatJakartaClock());
  const [now, setNow] = useState(() => new Date());
  const [volume, setVolume] = useState(1);
  const [cue, setCue] = useState<MalamPuncakCue>(() => readStoredCue(year));
  const [lastPong, setLastPong] = useState(0);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const connected = lastPong > 0 && now.getTime() - lastPong < STAGE_PING_MS;

  const publish = useCallback(
    (next: MalamPuncakCue) => {
      setCue(next);
      postCue(channelRef.current, year, next);
    },
    [year],
  );

  useEffect(() => {
    const channel = createMalamPuncakChannel(year, (msg) => {
      if (msg.type === "hello") {
        const current = readStoredCue(year);
        postCue(channel, year, { ...current, at: Date.now() });
      }
      if (msg.type === "pong") {
        setLastPong(Date.now());
      }
    });
    channelRef.current = channel;
    return () => {
      channel?.close();
      channelRef.current = null;
    };
  }, [year]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setClock(formatJakartaClock());
      setNow(new Date());
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  function playSlot(slot: RundownSlot) {
    publish(cueFromSlot(slot, true, volume));
  }

  function pause() {
    if (cue.mode === "idle") return;
    publish({ ...cue, playing: false, at: Date.now() });
  }

  function stopToLogo() {
    publish({ ...IDLE_CUE, volume, at: Date.now() });
  }

  function openStage() {
    const url = `/activities/agustusan/${year}/malam-puncak/stage`;
    window.open(url, "nahara-malam-puncak-stage", "noopener,noreferrer");
  }

  function onVolume(next: number) {
    setVolume(next);
    if (cue.mode === "video" || cue.mode === "audio") {
      publish({ ...cue, volume: next, at: Date.now() });
    }
  }

  const currentIds = useMemo(
    () =>
      new Set(
        MALAM_PUNCAK_RUNDOWN.filter((s) => isSlotCurrent(s, now)).map(
          (s) => s.id,
        ),
      ),
    [now],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={`/activities/agustusan/${year}`}
            className="text-sm text-slate-500 hover:text-accent"
          >
            ← Edisi
          </Link>
          <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">
            Operator Malam Puncak
          </h1>
          <p className="mt-1 text-sm text-slate-500">{PEAK_EVENT.location}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-3xl font-semibold tabular-nums text-slate-900">
            {clock}
          </p>
          <p className="text-xs text-slate-500">WIB</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-primary gap-2" onClick={openStage}>
          <MonitorUp className="h-4 w-4" />
          Buka layar projector
        </button>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            connected
              ? "bg-emerald-50 text-emerald-800"
              : "bg-amber-50 text-amber-900"
          }`}
        >
          {connected ? "Layar terhubung" : "Layar belum terhubung"}
        </span>
        <Link
          href={`/activities/agustusan/${year}/qr`}
          target="_blank"
          className="btn-secondary gap-1.5 py-2 text-xs"
        >
          QR <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        <Link
          href={`/activities/agustusan/${year}/doorprize/spin`}
          target="_blank"
          className="btn-secondary gap-1.5 py-2 text-xs"
        >
          Spin doorprize <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        <Link
          href={`/activities/agustusan/${year}/duck-race`}
          target="_blank"
          className="btn-secondary gap-1.5 py-2 text-xs"
        >
          Duck race <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="card flex flex-wrap items-center gap-3 py-4">
        <button
          type="button"
          className="btn-secondary gap-1.5"
          onClick={pause}
          disabled={cue.mode === "idle" || !cue.playing}
        >
          <Pause className="h-4 w-4" />
          Pause
        </button>
        <button type="button" className="btn-secondary gap-1.5" onClick={stopToLogo}>
          <Square className="h-4 w-4" />
          Logo
        </button>
        <label className="ml-auto flex items-center gap-2 text-sm text-slate-600">
          <Volume2 className="h-4 w-4" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => onVolume(Number(e.target.value))}
          />
        </label>
        <p className="w-full text-xs text-slate-500">
          Cue aktif:{" "}
          <strong className="text-slate-700">
            {cue.slotId ?? "logo"} · {cue.mode}
            {cue.playing ? " · playing" : ""}
          </strong>
        </p>
      </div>

      <ol className="space-y-2">
        {MALAM_PUNCAK_RUNDOWN.map((slot) => {
          const current = currentIds.has(slot.id);
          const active = cue.slotId === slot.id;
          const canPlay = slot.cue.kind !== "idle";
          return (
            <li
              key={slot.id}
              className={`rounded-xl border p-4 ${
                active
                  ? "border-[#7a1218]/50 bg-[#7a1218]/5"
                  : current
                    ? "border-gold/50 bg-gold/5"
                    : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex flex-wrap items-start gap-3">
                <div className="w-28 shrink-0 font-mono text-sm text-slate-600">
                  {slot.start}–{slot.end}
                  <div className="text-xs text-slate-400">{slot.durationLabel}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-slate-900">{slot.title}</h2>
                    {current && (
                      <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-dark">
                        Sekarang
                      </span>
                    )}
                    {active && (
                      <span className="rounded-full bg-[#7a1218]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#7a1218]">
                        Di layar
                      </span>
                    )}
                  </div>
                  {slot.presenter ? (
                    <p className="mt-0.5 text-sm text-slate-600">{slot.presenter}</p>
                  ) : null}
                  {slot.notes ? (
                    <p className="mt-0.5 text-xs text-slate-500">{slot.notes}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {canPlay && (
                      <button
                        type="button"
                        className="btn-primary gap-1.5 py-1.5 text-xs"
                        onClick={() => playSlot(slot)}
                      >
                        <Play className="h-3.5 w-3.5" />
                        Play
                      </button>
                    )}
                    {!canPlay && (
                      <button
                        type="button"
                        className="btn-secondary py-1.5 text-xs"
                        onClick={() =>
                          publish({
                            ...IDLE_CUE,
                            slotId: slot.id,
                            title: slot.title,
                            volume,
                            at: Date.now(),
                          })
                        }
                      >
                        Tampilkan logo
                      </button>
                    )}
                    {(slot.shortcuts ?? []).map((kind) => {
                      const item = rundownShortcutHref(kind, year);
                      return (
                        <Link
                          key={kind}
                          href={item.href}
                          target="_blank"
                          className="btn-secondary gap-1 py-1.5 text-xs"
                        >
                          {item.label}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
