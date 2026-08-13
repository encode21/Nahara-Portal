"use client";

import {
  buildDuckRaceWhatsAppText,
  formatDuckRaceWhen,
  formatDuckRaceWinnerHouse,
} from "@/lib/agustusan/duck-race";
import type { EventDuckRace } from "@/lib/types";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

type Props = {
  races: EventDuckRace[];
};

export function DuckRaceHistory({ races }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyWhatsApp(race: EventDuckRace) {
    await navigator.clipboard.writeText(buildDuckRaceWhatsAppText(race));
    setCopiedId(race.id);
    window.setTimeout(() => setCopiedId(null), 2000);
  }

  if (races.length === 0) {
    return (
      <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
        Belum ada race history.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2 font-medium">Race ID</th>
            <th className="px-3 py-2 font-medium">Pemenang</th>
            <th className="hidden px-3 py-2 font-medium sm:table-cell">Peserta</th>
            <th className="hidden px-3 py-2 font-medium md:table-cell">Waktu</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {races.map((race) => (
            <tr key={race.id} className="border-t border-slate-100">
              <td className="px-3 py-2.5 font-mono text-xs font-semibold text-slate-900">
                {race.race_code}
              </td>
              <td className="px-3 py-2.5">
                <span className="font-semibold tabular-nums text-[#7a1218]">
                  {race.winner_household_label ?? "—"}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {formatDuckRaceWinnerHouse(race)}
                </span>
              </td>
              <td className="hidden px-3 py-2.5 tabular-nums sm:table-cell">
                {race.participant_count}
              </td>
              <td className="hidden px-3 py-2.5 text-xs text-slate-600 md:table-cell">
                {formatDuckRaceWhen(race.finished_at ?? race.started_at)}
              </td>
              <td className="px-3 py-2.5 capitalize text-slate-600">{race.status}</td>
              <td className="px-3 py-2.5 text-right">
                {(race.status === "finished" || race.winner_household_label) && (
                  <button
                    type="button"
                    className="btn-secondary px-2 py-1 text-xs"
                    onClick={() => copyWhatsApp(race)}
                  >
                    {copiedId === race.id ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
