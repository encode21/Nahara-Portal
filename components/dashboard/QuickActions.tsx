import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  QUICK_ACTIONS,
  QUICK_ACTION_TONE_CLASS,
} from "@/lib/constants/quick-actions";

export function QuickActions() {
  return (
    <section>
      <h2 className="section-title">Aksi cepat</h2>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {QUICK_ACTIONS.map(({ href, label, hint, icon: Icon, tone }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "surface-tile flex items-center gap-3 px-3 py-3",
              tone === "danger" && "border-red-100 hover:border-red-200",
            )}
          >
            <span
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1",
                QUICK_ACTION_TONE_CLASS[tone],
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 text-left">
              <span className="block text-sm font-semibold text-ink">{label}</span>
              <span className="block text-[11px] text-ink-faint">{hint}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
