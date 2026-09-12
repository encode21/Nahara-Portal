import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatClockWib, formatRelativeId } from "@/lib/situation/format";
import type { SituationStatus } from "@/lib/situation/types";
import { SituationStatusIcon } from "@/components/situation/SituationStatusIcon";
import { GempaShareButton } from "@/components/notifications/GempaShareButton";
import { BMKG_GEMPA_SOURCE_PAGE } from "@/lib/lingkungan/gempa-shared";

function wrapClass(status: SituationStatus["status"]): string {
  switch (status) {
    case "critical":
      return "border-red-200 bg-red-50";
    case "warning":
      return "border-amber-200 bg-amber-50";
    case "info":
      return "border-sky-200 bg-sky-50";
    case "unknown":
      return "border-sand-200 bg-sand-100";
    default:
      return "border-sand-200 bg-white";
  }
}

export function SituationAlertCard({ status }: { status: SituationStatus }) {
  const updated =
    formatRelativeId(status.updatedAt) ?? formatClockWib(status.updatedAt);

  return (
    <article
      className={cn("rounded-2xl border px-3.5 py-3", wrapClass(status.status))}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/70 ring-1 ring-black/5">
          <SituationStatusIcon name={status.icon} className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{status.title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
            {status.summary}
          </p>
          {status.affectedArea && (
            <p className="mt-1 text-[11px] font-medium text-ink">
              Area: {status.affectedArea}
            </p>
          )}
          {status.detail && (
            <p className="mt-1 text-[11px] leading-relaxed text-ink-faint">
              {status.detail}
            </p>
          )}

          {status.impact && status.impact.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                Dampak potensial
              </p>
              <ul className="mt-1 list-inside list-disc text-[11px] text-ink-soft">
                {status.impact.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {status.recommendations && status.recommendations.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                Saran
              </p>
              <ul className="mt-1 list-inside list-disc text-[11px] text-ink-soft">
                {status.recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-ink-faint">
            {status.source && <span>{status.source}</span>}
            {updated && <span>· {updated}</span>}
            {status.stale && (
              <span className="font-medium text-amber-800">Data usang</span>
            )}
            {status.dataOrigin === "manual" && (
              <span className="rounded bg-white/60 px-1 py-0.5">Ops</span>
            )}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {status.actionHref && (
              status.actionHref.startsWith("http") ? (
                <a
                  href={status.actionHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-ink px-3 text-xs font-medium text-white"
                >
                  {status.actionLabel ?? "Detail"}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <Link
                  href={status.actionHref}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-ink px-3 text-xs font-medium text-white"
                >
                  {status.actionLabel ?? "Detail"}
                </Link>
              )
            )}
            {status.id === "earthquake" &&
              status.status !== "normal" &&
              status.status !== "unknown" && (
                <GempaShareButton
                  title={status.title}
                  summary={status.summary}
                  detail={status.detail}
                  sourceUrl={status.actionHref ?? BMKG_GEMPA_SOURCE_PAGE}
                />
              )}
          </div>
        </div>
      </div>
    </article>
  );
}
