"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ClipboardList,
  Megaphone,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import type { PortalNotification } from "@/lib/notifications/types";
import { cn, timeAgo } from "@/lib/utils";
import { markNotificationRead } from "@/lib/notifications/api";
import { usePortalNotifications } from "@/lib/hooks/usePortalNotifications";

const CATEGORY_META: Record<
  string,
  { icon: LucideIcon; tone: string; iconTone: string }
> = {
  announcement: {
    icon: Megaphone,
    tone: "bg-sky-50 text-sky-700",
    iconTone: "bg-sky-100 text-sky-700",
  },
  event: {
    icon: CalendarDays,
    tone: "bg-violet-50 text-violet-700",
    iconTone: "bg-violet-100 text-violet-700",
  },
  report: {
    icon: ClipboardList,
    tone: "bg-emerald-50 text-emerald-700",
    iconTone: "bg-emerald-100 text-emerald-700",
  },
  emergency: {
    icon: TriangleAlert,
    tone: "bg-amber-50 text-amber-800",
    iconTone: "bg-amber-100 text-amber-800",
  },
  system: {
    icon: Bell,
    tone: "bg-slate-50 text-slate-700",
    iconTone: "bg-slate-100 text-slate-600",
  },
};

type Props = {
  item: PortalNotification;
  wargaId: string;
  onRead: (id: string) => void;
};

export function NotificationItem({ item, wargaId, onRead }: Props) {
  const router = useRouter();
  const { refreshUnread } = usePortalNotifications();
  const meta = CATEGORY_META[item.category] ?? CATEGORY_META.system;
  const Icon = meta.icon;
  const unread = !item.is_read;

  async function open() {
    if (unread) {
      try {
        await markNotificationRead(wargaId, item.id);
        onRead(item.id);
        void refreshUnread();
      } catch {
        /* still navigate */
      }
    }
    router.push(item.target_url || "/notifikasi");
  }

  return (
    <button
      type="button"
      onClick={() => void open()}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border px-3.5 py-3 text-left transition",
        unread
          ? "border-sand-200 bg-gold/[0.07] hover:bg-gold/10"
          : "border-transparent bg-transparent hover:bg-sand-50"
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          meta.iconTone
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "text-sm text-ink",
              unread ? "font-semibold" : "font-medium"
            )}
          >
            {item.title}
          </span>
          {unread && (
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold"
              aria-label="Belum dibaca"
            />
          )}
        </span>
        <span className="mt-0.5 line-clamp-2 text-sm text-ink-soft">
          {item.message}
        </span>
        <span className="mt-1 block text-xs text-ink-faint">
          {timeAgo(item.created_at)}
        </span>
      </span>
    </button>
  );
}

export function NotificationEmptyState() {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sand-100 text-ink-faint">
        <Bell className="h-7 w-7" strokeWidth={1.5} />
      </span>
      <h2 className="mt-4 font-display text-lg font-semibold text-ink">
        Belum ada notifikasi
      </h2>
      <p className="mt-1.5 max-w-sm text-sm text-ink-soft">
        Informasi terbaru dari Pengumuman, Kegiatan, dan perkembangan Pengaduan
        akan muncul di sini.
      </p>
      <Link href="/pengumuman" className="btn-secondary mt-6">
        Lihat Pengumuman
      </Link>
    </div>
  );
}
