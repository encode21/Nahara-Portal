const PUSH_SW_URL = "/push-sw.js";
const DISMISS_KEY = "nahara.portal_push_dismissed";

export function isPortalPushDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissPortalPushPrompt(): void {
  localStorage.setItem(DISMISS_KEY, "1");
}

export function resetPortalPushDismiss(): void {
  localStorage.removeItem(DISMISS_KEY);
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

async function ensurePushRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration(PUSH_SW_URL);
  if (existing) return existing;
  return navigator.serviceWorker.register(PUSH_SW_URL, { scope: "/" });
}

export function canUseWebPush(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export async function upsertPortalPushSubscription(
  wargaId: string
): Promise<"ok" | "denied" | "unsupported" | "vapid_missing" | "error"> {
  if (!canUseWebPush()) return "unsupported";

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  if (!vapidPublic) return "vapid_missing";

  const permission =
    Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission();

  if (permission !== "granted") return "denied";

  try {
    const registration = await ensurePushRegistration();
    await navigator.serviceWorker.ready;

    let sub = await registration.pushManager.getSubscription();
    if (!sub) {
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublic) as BufferSource,
      });
    }

    const json = sub.toJSON();
    const endpoint = json.endpoint;
    const p256dh = json.keys?.p256dh;
    const auth = json.keys?.auth;
    if (!endpoint || !p256dh || !auth) return "error";

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { error } = await supabase.rpc("upsert_portal_push_subscription", {
      p_warga_id: wargaId,
      p_endpoint: endpoint,
      p_p256dh: p256dh,
      p_auth: auth,
      p_user_agent: navigator.userAgent.slice(0, 240),
    });
    if (error) return "error";
    return "ok";
  } catch {
    return "error";
  }
}

/** Re-associate existing browser push subscription with a new household. */
export async function rebindPortalPushToWarga(
  wargaId: string
): Promise<void> {
  if (!canUseWebPush()) return;
  if (Notification.permission !== "granted") return;

  try {
    const registration = await ensurePushRegistration();
    const sub = await registration.pushManager.getSubscription();
    if (!sub) return;

    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.rpc("upsert_portal_push_subscription", {
      p_warga_id: wargaId,
      p_endpoint: json.endpoint,
      p_p256dh: json.keys.p256dh,
      p_auth: json.keys.auth,
      p_user_agent: navigator.userAgent.slice(0, 240),
    });
  } catch {
    /* ignore */
  }
}
