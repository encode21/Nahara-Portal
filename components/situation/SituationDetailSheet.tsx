"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { SituationBundle } from "@/lib/situation/types";
import type { LingkunganSnapshot } from "@/lib/lingkungan/types";
import { SituationAlertCard } from "@/components/situation/SituationAlertCard";
import { SituationStatusIcon } from "@/components/situation/SituationStatusIcon";
import { LingkunganDashboardCard } from "@/components/dashboard/LingkunganDashboardCard";
import { cn } from "@/lib/utils";
import { formatRelativeId } from "@/lib/situation/format";

type Props = {
  open: boolean;
  onClose: () => void;
  bundle: SituationBundle;
  lingkungan: LingkunganSnapshot;
};

const CATEGORY_LABEL: Record<string, string> = {
  weather: "Cuaca & bencana alam",
  environment: "Lingkungan",
  utility: "Utilitas",
  access: "Akses & keamanan",
};

/** Covered by LingkunganDashboardCard at top of sheet. */
const LINGKUNGAN_COVERED = new Set([
  "weather",
  "aqi",
  "heavy_rain",
  "lightning",
  "strong_wind",
  "earthquake",
  "volcano",
]);

function toneDot(status: string): string {
  switch (status) {
    case "critical":
      return "bg-red-500";
    case "warning":
      return "bg-amber-500";
    case "info":
      return "bg-sky-500";
    case "unknown":
      return "bg-ink-faint";
    default:
      return "bg-emerald-500";
  }
}

export function SituationDetailSheet({
  open,
  onClose,
  bundle,
  lingkungan,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const byCategory = {
    weather: bundle.statuses.filter((s) => s.category === "weather"),
    environment: bundle.statuses.filter((s) => s.category === "environment"),
    utility: bundle.statuses.filter((s) => s.category === "utility"),
    access: bundle.statuses.filter((s) => s.category === "access"),
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="situation-sheet-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[1px]"
        onClick={onClose}
        aria-label="Tutup"
      />
      <div className="relative z-10 flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-sand-50 shadow-lift sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-sand-200 px-4 py-3">
          <div>
            <p
              id="situation-sheet-title"
              className="font-display text-base font-semibold text-ink"
            >
              Semua kondisi
            </p>
            <p className="text-[11px] text-ink-faint">
              Diperbarui{" "}
              {formatRelativeId(bundle.fetchedAt) ?? "baru-baru ini"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-ink ring-1 ring-sand-200"
            aria-label="Tutup daftar kondisi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-4 py-4">
          <section>
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Cuaca & lingkungan
            </h3>
            <LingkunganDashboardCard data={lingkungan} embedded />
          </section>

          {bundle.promoted.filter((s) => !LINGKUNGAN_COVERED.has(s.id))
            .length > 0 && (
            <section className="space-y-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                Perlu perhatian
              </h3>
              {bundle.promoted
                .filter((s) => !LINGKUNGAN_COVERED.has(s.id))
                .map((s) => (
                  <SituationAlertCard key={`p-${s.id}`} status={s} />
                ))}
            </section>
          )}

          {(
            Object.keys(byCategory) as Array<keyof typeof byCategory>
          ).map((cat) => (
            <section key={cat} className="space-y-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                {CATEGORY_LABEL[cat]}
              </h3>
              <ul className="space-y-1.5">
                {byCategory[cat].map((s) => (
                  <li
                    key={s.id}
                    className="flex items-start gap-2.5 rounded-xl bg-white px-3 py-2.5 ring-1 ring-sand-200"
                  >
                    <SituationStatusIcon
                      name={s.icon}
                      className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-1.5 w-1.5 shrink-0 rounded-full",
                            toneDot(s.status),
                          )}
                        />
                        <p className="text-sm font-medium text-ink">
                          {s.shortLabel}
                        </p>
                        <span className="ml-auto text-[10px] uppercase tracking-wide text-ink-faint">
                          {s.status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-ink-soft">
                        {s.summary}
                      </p>
                      {s.source && (
                        <p className="mt-0.5 text-[10px] text-ink-faint">
                          {s.source}
                          {s.dataOrigin === "future" ||
                          (s.dataOrigin === "manual" && s.status === "normal")
                            ? " · menunggu Ops"
                            : ""}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
