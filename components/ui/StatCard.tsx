import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: string | number;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const variants = {
    default: "text-slate-900",
    success: "text-emerald-600",
    warning: "text-amber-600",
    danger: "text-red-600",
  };

  return (
    <div className="card">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold", variants[variant])}>{value}</p>
    </div>
  );
}
