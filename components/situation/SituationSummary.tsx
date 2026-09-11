import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Info,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SituationHeadline } from "@/lib/situation/types";

const STYLES: Record<
  SituationHeadline["level"],
  { wrap: string; chip: string; icon: string; label: string }
> = {
  normal: {
    wrap: "border-emerald-200 bg-emerald-50",
    chip: "bg-emerald-100 text-emerald-800",
    icon: "text-emerald-700",
    label: "NORMAL",
  },
  info: {
    wrap: "border-sky-200 bg-sky-50",
    chip: "bg-sky-100 text-sky-900",
    icon: "text-sky-700",
    label: "INFO",
  },
  warning: {
    wrap: "border-amber-200 bg-amber-50",
    chip: "bg-amber-100 text-amber-950",
    icon: "text-amber-800",
    label: "WASPADA",
  },
  critical: {
    wrap: "border-red-200 bg-red-50",
    chip: "bg-red-100 text-red-800",
    icon: "text-red-700",
    label: "DARURAT",
  },
  unknown: {
    wrap: "border-sand-200 bg-sand-100",
    chip: "bg-white text-ink-soft",
    icon: "text-ink-faint",
    label: "DATA TERBATAS",
  },
};

function HeadlineIcon({ level }: { level: SituationHeadline["level"] }) {
  const className = cn("mt-0.5 h-5 w-5 shrink-0", STYLES[level].icon);
  if (level === "normal") return <CheckCircle2 className={className} />;
  if (level === "critical") return <ShieldAlert className={className} />;
  if (level === "warning") return <AlertTriangle className={className} />;
  if (level === "info") return <Info className={className} />;
  return <HelpCircle className={className} />;
}

export function SituationSummary({
  headline,
  className,
}: {
  headline: SituationHeadline;
  className?: string;
}) {
  const style = STYLES[headline.level];
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <HeadlineIcon level={headline.level} />
      <div className="min-w-0 flex-1">
        <span
          className={cn(
            "rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]",
            style.chip,
          )}
        >
          {style.label}
        </span>
        <p className="mt-1 text-sm font-semibold leading-snug text-ink">
          {headline.title}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
          {headline.detail}
        </p>
      </div>
    </div>
  );
}

export { STYLES as situationHeadlineStyles };
