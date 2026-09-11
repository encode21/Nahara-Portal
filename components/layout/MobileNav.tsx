"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PORTAL_PRIMARY_TABS } from "@/lib/constants/portal-tabs";
import { cn } from "@/lib/utils";
import { useAppSurface } from "@/lib/hooks/useAppSurface";
import { usePortalNotifications } from "@/lib/hooks/usePortalNotifications";
import { isMalamPuncakStagePath } from "@/lib/agustusan/malam-puncak-path";

/**
 * Bottom tab bar for the resident portal on mobile (app-like navigation).
 */
export function MobileNav() {
  const pathname = usePathname();
  const surface = useAppSurface();
  const { unreadCount } = usePortalNotifications();

  if (surface !== "portal") return null;
  if (isMalamPuncakStagePath(pathname)) return null;
  if (pathname.startsWith("/darurat")) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-sand-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgba(28,25,23,0.06)] backdrop-blur md:hidden"
      aria-label="Navigasi utama"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
        {PORTAL_PRIMARY_TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          const showBadge = tab.href === "/notifikasi" && unreadCount > 0;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-medium transition-colors",
                active ? "text-gold-dark" : "text-ink-faint hover:text-ink-soft",
              )}
            >
              <span
                className={cn(
                  "relative flex h-8 w-8 items-center justify-center rounded-xl transition-colors",
                  active ? "bg-gold/15 text-gold-dark" : "bg-transparent",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
                {showBadge && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold leading-none text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
              <span className="truncate">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
