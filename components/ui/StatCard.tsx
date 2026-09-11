import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  variant = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const variants = {
    default: "text-ink",
    success: "text-emerald-600",
    warning: "text-amber-600",
    danger: "text-red-600",
  };

  return (
    <div className="card flex items-start gap-3">
      {Icon && (
        <span className="icon-badge">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">{label}</p>
        <p className={cn("mt-1 font-display text-2xl font-bold", variants[variant])}>{value}</p>
        {hint && <p className="mt-0.5 text-xs text-ink-soft">{hint}</p>}
      </div>
    </div>
  );
}
