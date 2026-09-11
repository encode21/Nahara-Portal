"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSurface } from "@/lib/hooks/useAppSurface";
import { isMalamPuncakStagePath } from "@/lib/agustusan/malam-puncak-path";
import {
  QUICK_ACTIONS,
  QUICK_ACTION_TONE_CLASS,
} from "@/lib/constants/quick-actions";

/**
 * Speed-dial FAB for portal mobile — mirrors Quick Actions.
 * Sits above the bottom tab bar.
 */
export function QuickActionsFab() {
  const pathname = usePathname();
  const surface = useAppSurface();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (surface !== "portal") return null;
  if (isMalamPuncakStagePath(pathname)) return null;
  if (pathname.startsWith("/darurat")) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[55] md:hidden">
      {open && (
        <button
          type="button"
          className="pointer-events-auto absolute inset-0 h-screen bg-slate-950/35"
          aria-label="Tutup aksi cepat"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className="pointer-events-none absolute bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 flex flex-col items-end gap-2.5"
      >
        {open && (
          <div
            className="pointer-events-auto flex w-[min(16.5rem,calc(100vw-2rem))] flex-col gap-2"
            role="menu"
            aria-label="Aksi cepat"
          >
            {[...QUICK_ACTIONS].reverse().map(({ href, label, hint, icon: Icon, tone }, i) => (
              <Link
                key={href}
                href={href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-2xl border border-sand-200 bg-white px-3 py-2.5 shadow-lift animate-landing-rise"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1",
                    QUICK_ACTION_TONE_CLASS[tone],
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block text-sm font-semibold text-ink">
                    {label}
                  </span>
                  <span className="block text-[11px] text-ink-faint">{hint}</span>
                </span>
              </Link>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full shadow-lift transition-transform active:scale-95",
            open
              ? "bg-ink text-white"
              : "bg-gold text-white hover:bg-gold-dark",
          )}
          aria-label={open ? "Tutup aksi cepat" : "Buka aksi cepat"}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </button>
      </div>
    </div>
  );
}
