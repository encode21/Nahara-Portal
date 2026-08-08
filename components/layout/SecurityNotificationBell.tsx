"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import type { SecurityNotification } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

export function SecurityNotificationBell({
  className,
  light,
  open,
  onOpenChange,
}: {
  className?: string;
  light?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const supabase = createClient();
  const { isAdmin, isSecurity, user, loading: authLoading } = useAuth();
  const canView = isAdmin || isSecurity;

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? !!open : internalOpen;
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  function setIsOpen(next: boolean) {
    if (!isControlled) setInternalOpen(next);
    onOpenChangeRef.current?.(next);
  }

  const [items, setItems] = useState<SecurityNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!canView) return;

    let query = supabase
      .from("security_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(8);

    if (isSecurity && !isAdmin && user?.email) {
      query = query.ilike("user_email", user.email);
    }

    const { data } = await query;
    const list = (data ?? []) as SecurityNotification[];
    setItems(list);
    setUnreadCount(list.filter((n) => !n.is_read).length);
  }, [supabase, canView, isSecurity, isAdmin, user?.email]);

  useEffect(() => {
    if (authLoading || !canView) return;
    fetchNotifications();

    const onFocus = () => fetchNotifications();
    window.addEventListener("focus", onFocus);
    const interval = window.setInterval(fetchNotifications, 60_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
    };
  }, [authLoading, canView, fetchNotifications]);

  // Delay outside listener so the opening tap on iOS doesn't instantly close
  useEffect(() => {
    if (!isOpen) return;

    let removeListeners: (() => void) | undefined;
    const setup = window.setTimeout(() => {
      function handlePointer(e: Event) {
        if (ref.current && !ref.current.contains(e.target as Node)) {
          if (!isControlled) setInternalOpen(false);
          onOpenChangeRef.current?.(false);
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
  }, [isOpen, isControlled]);

  async function markRead(id: string) {
    await supabase.from("security_notifications").update({ is_read: true }).eq("id", id);
    fetchNotifications();
  }

  if (authLoading || !canView) return null;

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative touch-manipulation rounded-lg p-2 transition-colors",
          light
            ? "text-white/90 hover:bg-white/10 hover:text-white"
            : "text-slate-600 hover:bg-gold/5 hover:text-gold-dark",
        )}
        aria-expanded={isOpen}
        aria-label={
          unreadCount > 0
            ? `${unreadCount} notifikasi belum dibaca`
            : "Notifikasi keamanan"
        }
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[80] cursor-default bg-black/20 sm:hidden"
            aria-label="Tutup notifikasi"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={cn(
              "z-[90] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg",
              // Mobile: full-width panel under header (avoids clipping)
              "fixed left-3 right-3 top-[3.75rem] max-h-[min(70vh,28rem)]",
              // Desktop: anchor to bell
              "sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-1.5 sm:w-[22rem] sm:max-h-96",
            )}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-medium text-slate-900">Notifikasi</p>
              {unreadCount > 0 && (
                <span className="text-xs text-amber-700">{unreadCount} baru</span>
              )}
            </div>

            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">
                Belum ada notifikasi pengaduan.
              </p>
            ) : (
              <ul className="max-h-[min(50vh,20rem)] overflow-y-auto overscroll-contain py-1 sm:max-h-80">
                {items.map((n) => (
                  <li key={n.id}>
                    <div
                      className={cn(
                        "border-b border-slate-50 px-4 py-3 last:border-0",
                        !n.is_read && "bg-gold/5",
                      )}
                    >
                      <p className="text-sm font-medium text-slate-900">{n.judul}</p>
                      {n.pesan && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">
                          {n.pesan}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-slate-400">
                          {timeAgo(n.created_at)}
                        </span>
                        {n.pengaduan_id && (
                          <Link
                            href={`/pengaduan/${n.pengaduan_id}`}
                            onClick={() => {
                              if (!n.is_read) markRead(n.id);
                              setIsOpen(false);
                            }}
                            className="text-[11px] font-medium text-gold-dark hover:underline"
                          >
                            Lihat pengaduan
                          </Link>
                        )}
                        {!n.is_read && (
                          <button
                            type="button"
                            onClick={() => markRead(n.id)}
                            className="touch-manipulation text-[11px] font-medium text-slate-500 hover:text-slate-700 hover:underline"
                          >
                            Tandai dibaca
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="border-t border-slate-100 px-4 py-2.5">
              <Link
                href="/info-security?tab=notifikasi"
                onClick={() => setIsOpen(false)}
                className="text-xs font-medium text-gold-dark hover:underline"
              >
                Buka Info Security
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
