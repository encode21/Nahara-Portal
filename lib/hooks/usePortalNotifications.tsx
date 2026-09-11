"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useWargaIdentity } from "@/lib/hooks/useWargaIdentity";
import { fetchUnreadNotificationCount } from "@/lib/notifications/api";
import { rebindPortalPushToWarga } from "@/lib/notifications/push";

type PortalNotificationsContextValue = {
  unreadCount: number;
  refreshUnread: () => Promise<void>;
  setUnreadCount: (n: number) => void;
  wargaId: string | null;
};

const PortalNotificationsContext =
  createContext<PortalNotificationsContextValue | null>(null);

export function PortalNotificationsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { identity, ready } = useWargaIdentity();
  const wargaId = identity?.wargaId ?? null;
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!wargaId) {
      setUnreadCount(0);
      return;
    }
    try {
      const n = await fetchUnreadNotificationCount(wargaId);
      setUnreadCount(n);
    } catch {
      setUnreadCount(0);
    }
  }, [wargaId]);

  // Identity switch: reset badge immediately, then refetch + rebind push
  useEffect(() => {
    if (!ready) return;
    setUnreadCount(0);
    if (!wargaId) return;

    void refreshUnread();
    void rebindPortalPushToWarga(wargaId);
  }, [ready, wargaId, refreshUnread]);

  const value = useMemo(
    () => ({
      unreadCount,
      refreshUnread,
      setUnreadCount,
      wargaId,
    }),
    [unreadCount, refreshUnread, wargaId]
  );

  return (
    <PortalNotificationsContext.Provider value={value}>
      {children}
    </PortalNotificationsContext.Provider>
  );
}

const EMPTY: PortalNotificationsContextValue = {
  unreadCount: 0,
  refreshUnread: async () => {},
  setUnreadCount: () => {},
  wargaId: null,
};

export function usePortalNotifications(): PortalNotificationsContextValue {
  return useContext(PortalNotificationsContext) ?? EMPTY;
}
