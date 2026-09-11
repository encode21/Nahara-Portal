import { cn } from "@/lib/utils";
import type { SituationStatus } from "@/lib/situation/types";
import { SituationStatusIcon } from "@/components/situation/SituationStatusIcon";

function toneClass(status: SituationStatus["status"]): string {
  switch (status) {
    case "critical":
      return "bg-red-50 text-red-900 ring-red-100";
    case "warning":
      return "bg-amber-50 text-amber-950 ring-amber-100";
    case "info":
      return "bg-sky-50 text-sky-900 ring-sky-100";
    case "unknown":
      return "bg-sand-100 text-ink-soft ring-sand-200";
    default:
      return "bg-white/80 text-ink ring-black/5";
  }
}

export function SituationStatusChip({ status }: { status: SituationStatus }) {
  return (
    <div
      className={cn(
        "min-w-[4.5rem] flex-1 rounded-xl px-2 py-2 text-center ring-1",
        toneClass(status.status),
      )}
    >
      <SituationStatusIcon
        name={status.icon}
        className="mx-auto h-3.5 w-3.5 opacity-80"
      />
      <p className="mt-1 font-display text-sm font-bold tabular-nums leading-tight">
        {status.chipValue ?? status.shortLabel}
      </p>
      <p className="truncate text-[9px] opacity-80">
        {status.chipHint ?? status.shortLabel}
      </p>
    </div>
  );
}
