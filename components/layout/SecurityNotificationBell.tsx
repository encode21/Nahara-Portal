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
}: {
  className?: string;
  light?: boolean;
}) {
  const supabase = createClient();
  const { isAdmin, isSecurity, user, loading: authLoading } = useAuth();
  const canView = isAdmin || isSecurity;

  const [open, setOpen] = useState(false);
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

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function markRead(id: string) {
    await supabase.from("security_notifications").update({ is_read: true }).eq("id", id);
    fetchNotifications();
  }

  if (authLoading || !canView) return null;

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative rounded-lg p-2 transition-colors",
          light
            ? "text-white/90 hover:bg-white/10 hover:text-white"
            : "text-slate-600 hover:bg-gold/5 hover:text-gold-dark",
        )}
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

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-[min(100vw-2rem,22rem)] rounded-xl border border-slate-200 bg-white shadow-lg">
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
            <ul className="max-h-80 overflow-y-auto py-1">
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
                          href="/pengaduan"
                          onClick={() => {
                            if (!n.is_read) markRead(n.id);
                            setOpen(false);
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
                          className="text-[11px] font-medium text-slate-500 hover:text-slate-700 hover:underline"
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
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-gold-dark hover:underline"
            >
              Buka Info Security
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
