import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: string;
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "default";
  className?: string;
};

const variants = {
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  danger: "bg-red-50 text-red-700 border border-red-200",
  info: "bg-blue-50 text-blue-700 border border-blue-200",
  neutral: "bg-slate-100 text-slate-600 border border-slate-200",
  default: "bg-slate-50 text-slate-700 border border-slate-200",
};

export function StatusBadge({ status, variant = "default", className }: StatusBadgeProps) {
  return (
    <span className={cn("status-badge", variants[variant], className)}>
      {status}
    </span>
  );
}

export function getPengaduanVariant(status: string): StatusBadgeProps["variant"] {
  switch (status) {
    case "Baru": return "info";
    case "Diproses": return "warning";
    case "Selesai": return "success";
    default: return "default";
  }
}

export function getHunianVariant(status: string): StatusBadgeProps["variant"] {
  switch (status) {
    case "Tetap": return "info";
    case "Kontrak": return "warning";
    case "Kosong": return "neutral";
    default: return "default";
  }
}

export function getIuranVariant(paid: boolean): StatusBadgeProps["variant"] {
  return paid ? "success" : "danger";
}
