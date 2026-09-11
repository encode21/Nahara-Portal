"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Grid2x2, Siren } from "lucide-react";
import { cn } from "@/lib/utils";
import { PORTAL_PRIMARY_TABS } from "@/lib/constants/portal-tabs";
import { portalNavItems, type NavItem } from "@/lib/constants/nav";
import { usePortalNotifications } from "@/lib/hooks/usePortalNotifications";

const EXTRA_SERVICES: NavItem[] = [
  {
    href: "/darurat",
    label: "Darurat",
    icon: Siren,
  },
];

/**
 * Compact desktop nav for portal — mirrors mobile primary tabs.
 * Full modules live under the Layanan dropdown (+ /layanan page).
 */
export function PortalDesktopNav() {
  const pathname = usePathname();
  const { unreadCount } = usePortalNotifications();
  const [layananOpen, setLayananOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLayananOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!layananOpen) return;

    function onPointer(e: Event) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setLayananOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLayananOpen(false);
    }

    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [layananOpen]);

  const layananTab = PORTAL_PRIMARY_TABS.find((t) => t.href === "/layanan")!;
  const layananActive = layananTab.match(pathname);
  const otherTabs = PORTAL_PRIMARY_TABS.filter((t) => t.href !== "/layanan");

  const serviceItems = [
    ...portalNavItems.filter((item) => item.href !== "/dashboard"),
    ...EXTRA_SERVICES,
  ];

  return (
    <nav
      className="hidden border-t border-sand-200 md:block"
      aria-label="Navigasi portal"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-1.5 lg:px-6">
        {otherTabs.slice(0, 2).map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          const showBadge = tab.href === "/notifikasi" && unreadCount > 0;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "nav-active"
                  : "text-ink-soft hover:bg-sand-100 hover:text-gold-dark",
              )}
            >
              <span className="relative">
                <Icon className="h-4 w-4 shrink-0" />
                {showBadge && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold leading-none text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
              {tab.label}
            </Link>
          );
        })}

        {/* Layanan dropdown */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setLayananOpen((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
              layananActive || layananOpen
                ? "nav-active"
                : "text-ink-soft hover:bg-sand-100 hover:text-gold-dark",
            )}
            aria-expanded={layananOpen}
            aria-haspopup="menu"
          >
            <Grid2x2 className="h-4 w-4 shrink-0" />
            Layanan
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                layananOpen && "rotate-180",
              )}
            />
          </button>

          {layananOpen && (
            <div
              role="menu"
              className="absolute left-0 top-full z-[90] mt-1.5 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-sand-200 bg-white py-2 shadow-lift"
            >
              <Link
                href="/layanan"
                role="menuitem"
                onClick={() => setLayananOpen(false)}
                className="mx-2 mb-1 flex items-center gap-2.5 rounded-xl bg-gold/10 px-3 py-2.5 text-sm font-semibold text-gold-dark hover:bg-gold/15"
              >
                <Grid2x2 className="h-4 w-4" />
                Semua layanan
              </Link>
              <div className="max-h-[min(24rem,60vh)] overflow-y-auto px-1">
                {serviceItems.map((item) => {
                  const Icon = item.icon;
                  const active =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      onClick={() => setLayananOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-sand-100 font-semibold text-gold-dark"
                          : "text-ink-soft hover:bg-sand-50 hover:text-ink",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {otherTabs.slice(2).map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          const showBadge = tab.href === "/notifikasi" && unreadCount > 0;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "nav-active"
                  : "text-ink-soft hover:bg-sand-100 hover:text-gold-dark",
              )}
            >
              <span className="relative">
                <Icon className="h-4 w-4 shrink-0" />
                {showBadge && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold leading-none text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
