"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCheck } from "lucide-react";
import { useWargaIdentity } from "@/lib/hooks/useWargaIdentity";
import { usePortalNotifications } from "@/lib/hooks/usePortalNotifications";
import {
  fetchPortalNotifications,
  markAllNotificationsRead,
  NOTIFICATION_PAGE_SIZE,
} from "@/lib/notifications/api";
import type {
  NotificationCategory,
  NotificationFilter,
  PortalNotification,
} from "@/lib/notifications/types";
import {
  NotificationEmptyState,
  NotificationItem,
} from "@/components/notifications/NotificationItem";
import { NotificationPushOptIn } from "@/components/notifications/NotificationPushOptIn";
import { LoadingSpinner } from "@/components/ui/Loading";
import { cn } from "@/lib/utils";
import { WargaIdentifyPrompt } from "@/components/warga/WargaIdentifyPrompt";

const FILTERS: { id: NotificationFilter; label: string }[] = [
  { id: "all", label: "Semua" },
  { id: "announcement", label: "Pengumuman" },
  { id: "event", label: "Kegiatan" },
  { id: "report", label: "Pengaduan" },
];

function dayKey(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round(
    (startToday.getTime() - startThat.getTime()) / 86400000
  );
  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Kemarin";
  return startThat.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function NotifikasiPage() {
  const { identity, ready, change } = useWargaIdentity();
  const { refreshUnread, setUnreadCount } = usePortalNotifications();
  const wargaId = identity?.wargaId ?? null;

  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [items, setItems] = useState<PortalNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const categoryParam =
    filter === "all" ? null : (filter as NotificationCategory);

  const loadMore = useCallback(async () => {
    if (!wargaId || items.length === 0) return;
    setLoadingMore(true);
    try {
      const before = items[items.length - 1]!.created_at;
      const rows = await fetchPortalNotifications(wargaId, {
        category: categoryParam,
        before,
        limit: NOTIFICATION_PAGE_SIZE,
      });
      setItems((prev) => [...prev, ...rows]);
      setHasMore(rows.length >= NOTIFICATION_PAGE_SIZE);
    } catch {
      setError("Gagal memuat notifikasi.");
    } finally {
      setLoadingMore(false);
    }
  }, [wargaId, categoryParam, items]);

  // Identity / filter change: hard reset inbox (no stale previous household)
  useEffect(() => {
    if (!ready) return;
    setItems([]);
    setHasMore(false);
    if (!wargaId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await fetchPortalNotifications(wargaId, {
          category: categoryParam,
          limit: NOTIFICATION_PAGE_SIZE,
        });
        if (cancelled) return;
        setItems(rows);
        setHasMore(rows.length >= NOTIFICATION_PAGE_SIZE);
      } catch {
        if (!cancelled) setError("Gagal memuat notifikasi.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, wargaId, categoryParam]);

  const groups = useMemo(() => {
    const map = new Map<string, PortalNotification[]>();
    for (const item of items) {
      const key = dayKey(item.created_at);
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [items]);

  const unreadInList = items.some((i) => !i.is_read);

  async function handleMarkAll() {
    if (!wargaId) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead(wargaId);
      setItems((prev) =>
        prev.map((n) => ({
          ...n,
          is_read: true,
          read_at: n.read_at ?? new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
      void refreshUnread();
    } catch {
      setError("Gagal menandai semua dibaca.");
    } finally {
      setMarkingAll(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (!wargaId) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <header>
          <h1 className="font-display text-2xl font-bold text-ink">Notifikasi</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Informasi terbaru untuk rumah Anda.
          </p>
        </header>
        <div className="rounded-2xl border border-sand-200 bg-sand-50 px-5 py-8 text-center">
          <p className="text-sm text-ink-soft">
            Pilih blok dan nomor rumah terlebih dahulu agar notifikasi ditampilkan
            untuk rumah Anda.
          </p>
          <button type="button" className="btn-primary mt-4" onClick={change}>
            Pilih rumah saya
          </button>
        </div>
        <WargaIdentifyPrompt />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Notifikasi</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Informasi terbaru untuk rumah Anda.
          </p>
        </div>
        {unreadInList && (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gold-dark hover:underline"
            disabled={markingAll}
            onClick={() => void handleMarkAll()}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Tandai semua dibaca
          </button>
        )}
      </header>

      <NotificationPushOptIn />

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition",
              filter === f.id
                ? "bg-gold text-white"
                : "bg-sand-100 text-ink-soft hover:bg-sand-200"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      ) : items.length === 0 ? (
        <NotificationEmptyState />
      ) : (
        <div className="space-y-6">
          {groups.map(([label, rows]) => (
            <section key={label}>
              <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-ink-faint">
                {label}
              </h2>
              <div className="space-y-1">
                {rows.map((item) => (
                  <NotificationItem
                    key={item.id}
                    item={item}
                    wargaId={wargaId}
                    onRead={(id) =>
                      setItems((prev) =>
                        prev.map((n) =>
                          n.id === id
                            ? {
                                ...n,
                                is_read: true,
                                read_at: new Date().toISOString(),
                              }
                            : n
                        )
                      )
                    }
                  />
                ))}
              </div>
            </section>
          ))}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                className="btn-secondary"
                disabled={loadingMore}
                onClick={() => void loadMore()}
              >
                {loadingMore ? "Memuat…" : "Muat lebih banyak"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
