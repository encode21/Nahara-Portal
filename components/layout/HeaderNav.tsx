"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  LogIn,
  Settings,
  Shield,
  User,
  Menu,
  X,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { getNavItemsForAccess } from "@/lib/constants/nav";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAppSurface, useHasMounted } from "@/lib/hooks/useAppSurface";
import { buildLandingUrl, buildOpsUrl, buildPortalUrl } from "@/lib/host";
import { NaharaLogo } from "./NaharaLogo";
import { SecurityNotificationBell } from "./SecurityNotificationBell";
import { isMalamPuncakStagePath } from "@/lib/agustusan/malam-puncak-path";
import { WargaIdentityChip, WargaIdentityMobileStrip } from "@/components/warga/WargaIdentityChip";

function UserMenu({
  userName,
  userEmail,
  isAdmin,
  isSecurity,
  onLogout,
  open,
  onOpenChange,
}: {
  userName: string;
  userEmail: string;
  isAdmin: boolean;
  isSecurity: boolean;
  onLogout: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  useEffect(() => {
    if (!open) return;

    let removeListeners: (() => void) | undefined;
    const setup = window.setTimeout(() => {
      function handlePointer(e: Event) {
        if (ref.current && !ref.current.contains(e.target as Node)) {
          onOpenChangeRef.current(false);
        }
      }
      document.addEventListener("pointerdown", handlePointer);
      document.addEventListener("touchstart", handlePointer, { passive: true });
      removeListeners = () => {
        document.removeEventListener("pointerdown", handlePointer);
        document.removeEventListener("touchstart", handlePointer);
      };
    }, 50);

    return () => {
      window.clearTimeout(setup);
      removeListeners?.();
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="flex touch-manipulation items-center gap-1.5 rounded-full border border-sand-200 px-2 py-1.5 transition-colors hover:bg-sand-100"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-light">
          <User className="h-4 w-4 text-gold-dark" />
        </div>
        <span className="hidden max-w-[100px] truncate text-sm font-medium text-ink sm:inline">
          {userName}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-ink-faint transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[80] cursor-default bg-black/20 sm:hidden"
            aria-label="Tutup menu pengguna"
            onClick={() => onOpenChange(false)}
          />
          <div
            role="menu"
            className={cn(
              "z-[90] overflow-hidden rounded-xl border border-sand-200 bg-white py-1 shadow-lg",
              "fixed left-3 right-3 top-[3.75rem]",
              "sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-1.5 sm:w-56",
            )}
          >
            <div className="border-b border-sand-200 px-4 py-3">
              <p className="truncate text-sm font-medium text-ink">
                {userName}
              </p>
              {userEmail && (
                <p className="truncate text-xs text-ink-soft">{userEmail}</p>
              )}
            </div>
            {isAdmin && (
              <Link
                href="/activities"
                role="menuitem"
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-soft hover:bg-sand-100"
              >
                <Settings className="h-4 w-4 text-ink-faint" />
                Kelola Kegiatan
              </Link>
            )}
            {(isSecurity || isAdmin) && (
              <Link
                href="/info-security?tab=notifikasi"
                role="menuitem"
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-soft hover:bg-sand-100"
              >
                <Shield className="h-4 w-4 text-ink-faint" />
                Notifikasi Security
              </Link>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onOpenChange(false);
                onLogout();
              }}
              className="flex w-full touch-manipulation items-center gap-2.5 px-4 py-2.5 text-sm text-ink-soft hover:bg-sand-100"
            >
              <LogOut className="h-4 w-4 text-ink-faint" />
              Keluar
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function HeaderNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const surface = useAppSurface();
  const hasMounted = useHasMounted();
  const { isAdmin, isStaff, isRegistryOnly, isSecurity, user, loading } =
    useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const navItems = useMemo(
    () =>
      getNavItemsForAccess({ surface, isAdmin, isStaff, isRegistryOnly }),
    [surface, isAdmin, isStaff, isRegistryOnly],
  );

  const opsLoginHref = buildOpsUrl("/login");
  const portalHomeHref = buildPortalUrl("/dashboard");
  /** Overlay gelap hanya di beranda / Agustusan; halaman baca pakai header putih. */
  const landingOverlay =
    surface === "landing" &&
    (pathname === "/" || pathname.startsWith("/agustusan"));

  async function handleLogout() {
    await supabase.auth.signOut();
    setMobileOpen(false);
    if (surface === "ops") {
      window.location.href = buildOpsUrl("/login");
      return;
    }
    router.refresh();
  }

  const userName =
    user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Pengurus";
  const userEmail = user?.email ?? "";
  // Security users have no admin/staff JWT role — treat any session as signed in
  const signedIn = !!user;

  function isActive(href: string) {
    return (
      pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
    );
  }

  const navLinkClass = (active: boolean) =>
    cn(
      "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors lg:px-3.5",
      active
        ? "nav-active"
        : "text-ink-soft hover:bg-sand-100 hover:text-gold-dark",
    );

  if (isMalamPuncakStagePath(pathname)) return null;

  return (
    <header
      className={cn(
        "z-50 w-full max-w-[100%]",
        landingOverlay
          ? "absolute inset-x-0 top-0 border-b border-white/10 bg-slate-950/25 backdrop-blur-sm"
          : "sticky top-0 border-b border-sand-200 bg-white/90 shadow-soft backdrop-blur",
      )}
    >
      {/* Bar 1: logo + actions (menu always visible on mobile) */}
      <div className="mx-auto flex max-w-7xl min-w-0 items-center justify-between gap-2 px-4 py-2 sm:gap-3 lg:px-6">
        <span
          className={cn(
            "min-w-0 shrink",
            landingOverlay &&
              "[&_img:last-child]:brightness-0 [&_img:last-child]:invert",
          )}
        >
          <NaharaLogo href={surface === "landing" ? "/" : "/dashboard"} />
        </span>

        <div
          className={cn(
            "relative z-[60] flex shrink-0 items-center gap-1 sm:gap-2",
            // Saat drawer terbuka, sembunyikan kontrol header agar tidak bentrok overlay
            mobileOpen && "pointer-events-none invisible md:pointer-events-auto md:visible",
          )}
        >
          {/* Chip hanya di bar header dari sm+; di mobile pakai strip di bawah */}
          {hasMounted && surface === "portal" && (
            <WargaIdentityChip className="hidden max-w-[11rem] sm:flex md:max-w-[16rem]" />
          )}
          {!loading && signedIn && (
            <SecurityNotificationBell
              light={landingOverlay}
              open={notifOpen}
              onOpenChange={(next) => {
                setNotifOpen(next);
                if (next) {
                  setUserMenuOpen(false);
                  setMobileOpen(false);
                }
              }}
            />
          )}
          {!loading &&
            (signedIn ? (
              <UserMenu
                userName={userName}
                userEmail={userEmail}
                isAdmin={isAdmin}
                isSecurity={isSecurity}
                open={userMenuOpen}
                onOpenChange={(next) => {
                  setUserMenuOpen(next);
                  if (next) {
                    setNotifOpen(false);
                    setMobileOpen(false);
                  }
                }}
                onLogout={handleLogout}
              />
            ) : surface === "landing" ? (
              <a
                href={opsLoginHref}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition",
                  landingOverlay
                    ? "text-white/90 hover:bg-white/10 hover:text-white"
                    : "text-ink-soft hover:bg-sand-100 hover:text-gold-dark",
                )}
              >
                <LogIn className="h-3.5 w-3.5" />
                Masuk
              </a>
            ) : surface === "portal" ? (
              <a href={opsLoginHref} className="btn-primary py-2 text-xs">
                <LogIn className="mr-1.5 h-3.5 w-3.5" />
                Masuk
              </a>
            ) : (
              <Link href="/login" className="btn-primary py-2 text-xs">
                <LogIn className="mr-1.5 h-3.5 w-3.5" />
                Masuk
              </Link>
            ))}

          {navItems.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setNotifOpen(false);
                setUserMenuOpen(false);
                setMobileOpen(true);
              }}
              className={cn(
                "shrink-0 rounded-lg p-2 md:hidden",
                landingOverlay
                  ? "text-white/90 hover:bg-white/10"
                  : "text-ink-soft hover:bg-sand-100",
              )}
              aria-label="Buka menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile: identitas warga di strip sendiri agar tidak menimpa hamburger */}
      {hasMounted && surface === "portal" && (
        <WargaIdentityMobileStrip
          className={mobileOpen ? "pointer-events-none invisible" : undefined}
        />
      )}

      {navItems.length > 0 && (
        <nav className="hidden border-t border-sand-200 md:block">
          <div className="mx-auto max-w-7xl overflow-x-auto overscroll-x-contain px-4 lg:px-6">
            <div className="flex w-max max-w-none gap-0.5 py-1.5">
              {navItems.map((item) => {
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
      )}

      {mobileOpen && (
        <div className="md:hidden">
          <button
            type="button"
            className="fixed inset-0 z-[100] cursor-default bg-slate-950/45 backdrop-blur-[2px]"
            aria-label="Tutup menu"
            onClick={() => setMobileOpen(false)}
          />

          <aside
            className="fixed inset-y-0 left-0 z-[110] flex w-[min(20rem,88vw)] flex-col bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi"
          >
            <div className="flex items-center justify-between gap-3 border-b border-sand-200 px-4 py-3">
              <NaharaLogo href={surface === "landing" ? "/" : "/dashboard"} />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-full bg-sand-100 text-ink-soft hover:bg-sand-200"
                aria-label="Tutup menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
                        isActive(item.href)
                          ? "bg-gold/15 text-gold-dark"
                          : "text-ink-soft hover:bg-sand-100",
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              {surface === "ops" && (
                <div className="mt-4 border-t border-sand-200 pt-4">
                  <a
                    href={portalHomeHref}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-ink-soft hover:bg-sand-100"
                  >
                    <ExternalLink className="h-5 w-5" />
                    Portal Warga
                  </a>
                </div>
              )}

              {signedIn && (
                <div className="mt-4 border-t border-sand-200 pt-4">
                  <div className="mb-2 px-3">
                    <p className="truncate text-sm font-semibold text-ink">
                      {userName}
                    </p>
                    {userEmail && (
                      <p className="truncate text-xs text-ink-soft">{userEmail}</p>
                    )}
                  </div>
                  {isAdmin && (
                    <Link
                      href="/activities"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-ink-soft hover:bg-sand-100"
                    >
                      <Settings className="h-5 w-5" />
                      Kelola Kegiatan
                    </Link>
                  )}
                  {(isSecurity || isAdmin) && (
                    <Link
                      href="/info-security?tab=notifikasi"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-ink-soft hover:bg-sand-100"
                    >
                      <Shield className="h-5 w-5" />
                      Notifikasi Security
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-5 w-5" />
                    Keluar
                  </button>
                </div>
              )}
            </nav>
          </aside>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  const pathname = usePathname();
  const surface = useAppSurface();
  const portalHome = buildPortalUrl("/dashboard");
  const opsLogin = buildOpsUrl("/login");
  const landingHome = buildLandingUrl("/");

  if (isMalamPuncakStagePath(pathname)) return null;

  if (surface === "landing") {
    return (
      <footer className="border-t border-white/10 bg-[#0f1419] px-5 py-8 text-center text-xs text-white/50">
        <p className="font-display text-sm font-semibold text-white/80">
          Cluster Nahara · Cimanggis Golf Estate (CGE)
        </p>
        <p className="mt-1 text-white/45">
          Paguyuban Warga · nahara.id · Cimanggis, Depok
        </p>
        <p className="mt-3 space-x-3">
          <Link href="/pengumuman" className="text-gold/90 hover:underline">
            Pengumuman
          </Link>
          <Link href="/agustusan" className="text-gold/90 hover:underline">
            Agustusan
          </Link>
          <Link href="/pengaduan" className="text-gold/90 hover:underline">
            Pengaduan
          </Link>
        </p>
        <p className="mt-4">© {new Date().getFullYear()} Paguyuban Warga Nahara</p>
      </footer>
    );
  }

  return (
    <footer className="border-t border-gold/15 bg-white py-4 text-center text-xs text-ink-soft">
      <p>
        © {new Date().getFullYear()} Nahara Portal Warga. All rights reserved.
      </p>
      <p className="mt-1 space-x-3">
        <a
          href={landingHome}
          className="text-gold-dark underline decoration-gold/30 underline-offset-2 hover:decoration-gold"
        >
          Beranda
        </a>
        <Link
          href="/panduan"
          className="text-gold-dark underline decoration-gold/30 underline-offset-2 hover:decoration-gold"
        >
          Panduan Penggunaan
        </Link>
        {surface === "portal" ? (
          <a
            href={opsLogin}
            className="text-gold-dark underline decoration-gold/30 underline-offset-2 hover:decoration-gold"
          >
            Masuk
          </a>
        ) : (
          <a
            href={portalHome}
            className="text-gold-dark underline decoration-gold/30 underline-offset-2 hover:decoration-gold"
          >
            Info warga
          </a>
        )}
      </p>
    </footer>
  );
}
