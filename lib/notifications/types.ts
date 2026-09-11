export type NotificationCategory =
  | "announcement"
  | "event"
  | "report"
  | "emergency"
  | "system";

export type NotificationTargetType = "all" | "block" | "household" | "user";

export type PortalNotification = {
  id: string;
  type: string;
  category: NotificationCategory;
  title: string;
  message: string;
  source_type: string;
  source_id: string;
  target_type: NotificationTargetType;
  target_id: string | null;
  target_url: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  read_at: string | null;
  is_read: boolean;
};

export type NotificationFilter = "all" | NotificationCategory;
