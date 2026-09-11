"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { SituationBundle } from "@/lib/situation/types";
import type { LingkunganSnapshot } from "@/lib/lingkungan/types";
import { cn } from "@/lib/utils";
import {
  SituationSummary,
  situationHeadlineStyles,
} from "@/components/situation/SituationSummary";
import { SituationStatusChip } from "@/components/situation/SituationStatusChip";
import { SituationAlertCard } from "@/components/situation/SituationAlertCard";
import { SituationDetailSheet } from "@/components/situation/SituationDetailSheet";
import { LingkunganDashboardCard } from "@/components/dashboard/LingkunganDashboardCard";

type Props = {
  bundle: SituationBundle;
  lingkungan: LingkunganSnapshot;
};

/** Already covered by LingkunganDashboardCard — don't repeat as alert cards. */
const LINGKUNGAN_COVERED = new Set([
  "weather",
  "aqi",
  "heavy_rain",
  "lightning",
  "strong_wind",
  "earthquake",
  "volcano",
]);

export function SituationCenter({ bundle, lingkungan }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const style = situationHeadlineStyles[bundle.headline.level];

  const extraAlerts = bundle.promoted.filter(
    (s) =>
      (s.status === "critical" || s.status === "warning") &&
      !LINGKUNGAN_COVERED.has(s.id),
  );

  return (
    <section className="space-y-3">
      <h2 className="section-title">Nahara Situation Center</h2>

      <div
        className={cn(
          "overflow-hidden rounded-2xl border",
          expanded ? "border-sand-200 bg-white shadow-soft" : style.wrap,
        )}
      >
        {/* Collapsed: headline + chips */}
        {!expanded && (
          <>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="flex w-full items-start gap-3 px-3.5 py-3 text-left transition hover:bg-black/[0.02]"
              aria-expanded={false}
              aria-controls="situation-expand"
            >
              <div className="min-w-0 flex-1">
                <SituationSummary headline={bundle.headline} />
              </div>
              <span className="mt-0.5 flex shrink-0 flex-col items-center gap-0.5">
                <ChevronDown className="h-4 w-4 text-ink-faint" />
                <span className="text-[9px] font-medium text-ink-faint">
                  Detail
                </span>
              </span>
            </button>

            <div className="border-t border-black/5 px-3 pb-3 pt-2">
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {bundle.chips.map((s) => (
                  <div
                    key={s.id}
                    className="min-w-[4.75rem] shrink-0 sm:min-w-0 sm:flex-1"
                  >
                    <SituationStatusChip status={s} />
                  </div>
                ))}
              </div>

              {bundle.normalCount > 0 && (
                <p className="mt-2 text-center text-[11px] text-ink-faint">
                  {bundle.normalCount} kondisi lainnya normal
                  {bundle.unknownCount > 0
                    ? ` · ${bundle.unknownCount} belum tersedia`
                    : ""}
                </p>
              )}
            </div>
          </>
        )}

        {/* Expanded: cuaca → AQI → Windy first, then status + extras */}
        {expanded && (
          <div id="situation-expand">
            <div className="flex items-center justify-between border-b border-sand-200 px-3.5 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
                Lingkungan & kewaspadaan
              </p>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-medium text-ink-soft transition hover:bg-sand-100"
                aria-expanded
                aria-controls="situation-expand"
              >
                Ciutkan
                <ChevronDown className="h-4 w-4 rotate-180" />
              </button>
            </div>

            <div className="space-y-3 p-3">
              <LingkunganDashboardCard data={lingkungan} embedded />

              <div className={cn("rounded-xl border px-3 py-2.5", style.wrap)}>
                <SituationSummary headline={bundle.headline} />
              </div>

              {extraAlerts.map((s) => (
                <SituationAlertCard key={s.id} status={s} />
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="flex w-full min-h-11 items-center justify-between rounded-2xl border border-sand-200 bg-white px-3.5 py-2.5 text-left text-sm font-medium text-ink shadow-soft transition hover:border-gold/35"
      >
        <span>Lihat semua kondisi</span>
        <ChevronRight className="h-4 w-4 text-ink-faint" />
      </button>

      <SituationDetailSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        bundle={bundle}
        lingkungan={lingkungan}
      />
    </section>
  );
}
