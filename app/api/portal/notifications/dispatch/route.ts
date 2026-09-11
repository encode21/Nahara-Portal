import webpush from "web-push";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPortalOrigin } from "@/lib/host";
import { isPortalAdmin, isPortalStaff } from "@/lib/auth/roles";

export const runtime = "nodejs";

type Body = {
  sourceType?: string;
  sourceId?: string;
  type?: string;
};

type NotifRow = {
  id: string;
  title: string;
  message: string;
  target_url: string;
};

type SubRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function POST(req: Request) {
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:admin@nahara.id";

  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json({ ok: false, skipped: true, reason: "vapid_missing" });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || (!isPortalAdmin(user) && !isPortalStaff(user))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.sourceType || !body.sourceId) {
    return NextResponse.json(
      { error: "sourceType and sourceId required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.rpc(
    "find_portal_notification_for_source",
    {
      p_source_type: body.sourceType,
      p_source_id: body.sourceId,
      p_type: body.type ?? null,
    }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const notifications = (data ?? []) as NotifRow[];
  if (notifications.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: "no_notification" });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  const origin = getPortalOrigin();
  let sent = 0;

  for (const n of notifications) {
    const { data: subs, error: subErr } = await supabase.rpc(
      "get_portal_push_subscriptions_for_notification",
      { p_notification_id: n.id }
    );
    if (subErr) continue;

    const list = (subs ?? []) as SubRow[];
    const payload = JSON.stringify({
      title: n.title || "Nahara",
      body: n.message,
      url: n.target_url?.startsWith("http")
        ? n.target_url
        : `${origin}${n.target_url || "/notifikasi"}`,
    });

    for (const s of list) {
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
        /* stale endpoints ignored */
      }
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    notifications: notifications.length,
  });
}
