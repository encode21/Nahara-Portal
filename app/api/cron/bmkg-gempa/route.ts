import webpush from "web-push";
import { NextResponse } from "next/server";
import { getPortalOrigin } from "@/lib/host";
import {
  fetchGempaAlerts,
  gempaNotificationCopy,
  gempaSourceUuid,
} from "@/lib/lingkungan/gempa";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Allow up to ~60s for BMKG + push fan-out. */
export const maxDuration = 60;

type SubRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

function authorizeCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  // Vercel Cron sends this when CRON_SECRET is configured on the project
  const cronHeader = req.headers.get("x-vercel-cron-secret");
  if (cronHeader && cronHeader === secret) return true;
  return false;
}

async function sendPushForNotification(input: {
  title: string;
  message: string;
  targetUrl: string;
  subs: SubRow[];
}): Promise<number> {
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:admin@nahara.id";
  if (!vapidPublic || !vapidPrivate || input.subs.length === 0) return 0;

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  const origin = getPortalOrigin();
  const url = input.targetUrl.startsWith("http")
    ? input.targetUrl
    : `${origin}${input.targetUrl}`;
  const payload = JSON.stringify({
    title: input.title,
    body: input.message,
    url,
  });

  let sent = 0;
  for (const s of input.subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.auth },
        },
        payload
      );
      sent += 1;
    } catch {
      /* stale endpoint */
    }
  }
  return sent;
}

async function runPoll() {
  const alerts = await fetchGempaAlerts({ cache: "no-store", limit: 8 });
  const supabase = createServiceClient();

  const { data: subsData } = await supabase
    .from("portal_push_subscriptions")
    .select("endpoint,p256dh,auth");
  const subs = (subsData ?? []) as SubRow[];

  let created = 0;
  let pushed = 0;
  const results: { id: string; created: boolean; pushSent: number }[] = [];

  for (const alert of alerts) {
    const sourceId = gempaSourceUuid(alert.id);
    const { title, message } = gempaNotificationCopy(alert);
    const targetUrl = "/notifikasi";
    const metadata = {
      bmkg_key: alert.id,
      magnitude: alert.magnitude,
      dist_km: alert.distKm,
      occurred_at: alert.occurredAt ?? null,
      source_url: alert.sourceUrl,
      severity: alert.severity,
    };

    const { data: inserted, error } = await supabase
      .from("notification_events")
      .insert({
        type: "earthquake_detected",
        category: "emergency",
        title,
        message,
        source_type: "bmkg_gempa",
        source_id: sourceId,
        target_type: "all",
        target_id: null,
        target_url: targetUrl,
        metadata,
      })
      .select("id")
      .maybeSingle();

    if (error) {
      // Unique conflict → already ingested
      if (error.code === "23505") {
        results.push({ id: alert.id, created: false, pushSent: 0 });
        continue;
      }
      throw error;
    }

    if (!inserted?.id) {
      results.push({ id: alert.id, created: false, pushSent: 0 });
      continue;
    }

    created += 1;
    const pushSent = await sendPushForNotification({
      title,
      message,
      targetUrl,
      subs,
    });
    pushed += pushSent;
    results.push({ id: alert.id, created: true, pushSent });
  }

  return {
    ok: true as const,
    scanned: alerts.length,
    created,
    pushed,
    results,
  };
}

export async function GET(req: Request) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await runPoll();
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "poll_failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
