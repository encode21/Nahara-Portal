import { createClient } from "@/lib/supabase/client";
import type {
  NotificationCategory,
  PortalNotification,
} from "@/lib/notifications/types";

const PAGE_SIZE = 20;

export async function fetchPortalNotifications(
  wargaId: string,
  opts?: {
    category?: NotificationCategory | null;
    before?: string | null;
    limit?: number;
  }
): Promise<PortalNotification[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("list_portal_notifications", {
    p_warga_id: wargaId,
    p_category: opts?.category ?? null,
    p_limit: opts?.limit ?? PAGE_SIZE,
    p_before: opts?.before ?? null,
  });
  if (error) throw error;
  return (data ?? []) as PortalNotification[];
}

export async function fetchUnreadNotificationCount(
  wargaId: string
): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc(
    "count_unread_portal_notifications",
    { p_warga_id: wargaId }
  );
  if (error) throw error;
  return Number(data ?? 0);
}

export async function markNotificationRead(
  wargaId: string,
  notificationId: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("mark_portal_notification_read", {
    p_warga_id: wargaId,
    p_notification_id: notificationId,
  });
  if (error) throw error;
}

export async function markAllNotificationsRead(
  wargaId: string
): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc(
    "mark_all_portal_notifications_read",
    { p_warga_id: wargaId }
  );
  if (error) throw error;
  return Number(data ?? 0);
}

/** Best-effort push fan-out after a domain write (ops session required). */
export function dispatchNotificationPush(payload: {
  sourceType: string;
  sourceId: string;
  type?: string;
}): void {
  if (typeof window === "undefined") return;
  void fetch("/api/portal/notifications/dispatch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {
    /* inbox is source of truth; push is optional */
  });
}

export { PAGE_SIZE as NOTIFICATION_PAGE_SIZE };
