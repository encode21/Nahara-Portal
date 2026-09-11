"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useWargaIdentity } from "@/lib/hooks/useWargaIdentity";
import {
  canUseWebPush,
  dismissPortalPushPrompt,
  isPortalPushDismissed,
  upsertPortalPushSubscription,
} from "@/lib/notifications/push";

/**
 * Soft opt-in for Web Push — only after household identity is set.
 * Never prompts the browser permission until the user taps Aktifkan.
 */
export function NotificationPushOptIn() {
  const { identity, ready } = useWargaIdentity();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !identity) {
      setVisible(false);
      return;
    }
    if (!canUseWebPush()) {
      setVisible(false);
      return;
    }
    if (Notification.permission === "granted") {
      // Keep subscription bound silently
      void upsertPortalPushSubscription(identity.wargaId);
      setVisible(false);
      return;
    }
    if (Notification.permission === "denied") {
      setVisible(false);
      return;
    }
    if (isPortalPushDismissed()) {
      setVisible(false);
      return;
    }
    setVisible(true);
  }, [ready, identity]);

  if (!visible || !identity) return null;

  async function enable() {
    setBusy(true);
    setMsg(null);
    const result = await upsertPortalPushSubscription(identity!.wargaId);
    setBusy(false);
    if (result === "ok") {
      dismissPortalPushPrompt();
      setVisible(false);
      return;
    }
    if (result === "denied") {
      dismissPortalPushPrompt();
      setVisible(false);
      return;
    }
    if (result === "vapid_missing") {
      setMsg("Konfigurasi push belum siap. Inbox tetap berfungsi.");
      return;
    }
    setMsg("Gagal mengaktifkan. Coba lagi nanti.");
  }

  return (
    <div className="rounded-2xl border border-sand-200 bg-gradient-to-br from-gold/10 to-white px-4 py-3.5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-dark">
          <Bell className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Aktifkan Notifikasi</p>
          <p className="mt-0.5 text-sm text-ink-soft">
            Dapatkan informasi Pengumuman, Kegiatan, dan perkembangan Pengaduan
            langsung di perangkat Anda.
          </p>
          {msg && <p className="mt-1.5 text-xs text-amber-700">{msg}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary"
              disabled={busy}
              onClick={() => void enable()}
            >
              {busy ? "Mengaktifkan…" : "Aktifkan"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={busy}
              onClick={() => {
                dismissPortalPushPrompt();
                setVisible(false);
              }}
            >
              Nanti saja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
