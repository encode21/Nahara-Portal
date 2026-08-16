"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PEAK_EVENT } from "@/lib/constants/agustusan";
import {
  MALAM_PUNCAK_DATE,
  MALAM_PUNCAK_RUNDOWN,
  formatJakartaClock,
  isSlotCurrent,
} from "@/lib/constants/agustusan-rundown";

export default function McRundownPage() {
  const params = useParams();
  const year = Number(params.year);
  const [clock, setClock] = useState("");
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setClock(formatJakartaClock());
      setNow(new Date());
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  const currentIds = useMemo(
    () =>
      new Set(
        MALAM_PUNCAK_RUNDOWN.filter((s) => now != null && isSlotCurrent(s, now)).map(
          (s) => s.id,
        ),
      ),
    [now],
  );

  const dateLabel = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${MALAM_PUNCAK_DATE}T12:00:00+07:00`));

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-1 pb-16 print:max-w-none print:space-y-3">
      <header className="print:break-inside-avoid">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#9b1b23]">
          Contek MC
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">
          Rundown Malam Puncak {Number.isFinite(year) ? year : ""}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {dateLabel} · {PEAK_EVENT.location}
        </p>
        <p className="mt-3 font-mono text-3xl font-semibold tabular-nums text-slate-900">
          {clock || "—:—:—"}{" "}
          <span className="text-sm font-normal text-slate-400">WIB</span>
        </p>
        <p className="mt-2 text-xs text-slate-500 print:hidden">
          Halaman ini untuk MC. Slot yang sedang berjalan ditandai. Bisa di-screenshot atau
          print.
        </p>
      </header>

      <ol className="space-y-3">
        {MALAM_PUNCAK_RUNDOWN.map((slot, i) => {
          const prev = MALAM_PUNCAK_RUNDOWN[i - 1];
          const showGroup = Boolean(slot.group && slot.group !== prev?.group);
          const current = currentIds.has(slot.id);
          return (
            <Fragment key={slot.id}>
              {showGroup && (
                <li className="list-none pt-2 first:pt-0">
                  <p className="border-b border-slate-200 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {slot.group}
                  </p>
                </li>
              )}
              <li
                className={`rounded-xl border p-4 print:break-inside-avoid ${
                  current
                    ? "border-[#7a1218]/50 bg-[#7a1218]/5"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex gap-3">
                  <div className="w-[4.75rem] shrink-0 font-mono text-sm text-slate-600">
                    <div>
                      {slot.start}–{slot.end}
                    </div>
                    <div className="text-xs text-slate-400">{slot.durationLabel}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-slate-900">{slot.title}</h2>
                      {slot.silent && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                          Hening
                        </span>
                      )}
                      {current && (
                        <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-dark">
                          Sekarang
                        </span>
                      )}
                    </div>
                    {slot.presenter ? (
                      <p className="mt-0.5 text-sm text-slate-600">{slot.presenter}</p>
                    ) : null}
                    <p className="mt-2 text-sm leading-relaxed text-slate-800">
                      {slot.mcNotes || slot.notes || "—"}
                    </p>
                  </div>
                </div>
              </li>
            </Fragment>
          );
        })}
      </ol>
    </div>
  );
}
