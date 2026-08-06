"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  LogIn,
  Settings,
  User,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { portalNavItems } from "@/lib/constants/nav";
import { useAuth } from "@/lib/hooks/useAuth";
import { NaharaLogo } from "./NaharaLogo";

function UserMenu({
  userName,
  userEmail,
  onLogout,
}: {
  userName: string;
  userEmail: string;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2 py-1.5 transition-colors hover:bg-gold/5"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/15">
          <User className="h-4 w-4 text-gold-dark" />
        </div>
        <span className="hidden max-w-[100px] truncate text-sm font-medium text-slate-800 sm:inline">
          {userName}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-medium text-slate-900">
              {userName}
            </p>
            {userEmail && (
              <p className="truncate text-xs text-slate-500">{userEmail}</p>
            )}
          </div>
          <Link
            href="/activities"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-gold/5"
          >
            <Settings className="h-4 w-4 text-slate-400" />
            Kelola Kegiatan
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-gold/5"
          >
            <LogOut className="h-4 w-4 text-slate-400" />
            Keluar
          </button>
        </div>
      )}
    </div>
  );
}

export function HeaderNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { isAdmin, user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.refresh();
    setMobileOpen(false);
  }

  const userName =
    user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Admin";
  const userEmail = user?.email ?? "";

  function isActive(href: string) {
    return (
      pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
    );
  }

  const navLinkClass = (active: boolean) =>
    cn(
      "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors lg:px-3",
      active
        ? "nav-active"
        : "text-slate-600 hover:bg-gold/5 hover:text-gold-dark",
    );

  return (
    <header className="sticky top-0 z-50 w-full max-w-[100%] overflow-x-clip border-b border-gold/20 bg-white shadow-sm">
      {/* Bar 1: logo + user */}
      <div className="mx-auto flex max-w-7xl min-w-0 items-center justify-between gap-2 px-4 py-2 sm:gap-3 lg:px-6">
        <NaharaLogo className="min-w-0" />

        <div className="flex items-center gap-2">
          {!loading &&
            (isAdmin ? (
              <UserMenu
                userName={userName}
                userEmail={userEmail}
                onLogout={handleLogout}
              />
            ) : (
              <Link href="/login" className="btn-primary py-2 text-xs">
                <LogIn className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">Masuk Admin</span>
                <span className="sm:hidden">Masuk</span>
              </Link>
            ))}

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-slate-600 hover:bg-gold/5 md:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Bar 2: nav — scroll horizontal di desktop/tablet */}
      <nav className="hidden border-t border-gold/10 md:block">
        <div className="mx-auto max-w-7xl overflow-x-auto overscroll-x-contain px-4 lg:px-6">
          <div className="flex w-max max-w-none gap-0.5 py-1.5">
            {portalNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={navLinkClass(isActive(item.href))}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile menu (drawer) */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-white px-4 py-6 shadow-lg md:hidden">
            <div className="flex items-center justify-between mb-4">
              <NaharaLogo />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-slate-600 hover:bg-gold/5"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="space-y-1">
              {portalNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                      isActive(item.href)
                        ? "nav-active"
                        : "text-slate-600 hover:bg-gold/5",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}

              {isAdmin && (
                <>
                  <div className="my-2 border-t border-slate-100" />
                  <Link
                    href="/activities"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-gold/5"
                  >
                    <Settings className="h-5 w-5" />
                    Kelola Kegiatan
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-gold/5"
                  >
                    <LogOut className="h-5 w-5" />
                    Keluar
                  </button>
                </>
              )}
            </nav>
          </aside>
        </>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-gold/15 bg-white py-4 text-center text-xs text-slate-500">
      © 2026 Nahara Portal Warga. All rights reserved.
    </footer>
  );
}
