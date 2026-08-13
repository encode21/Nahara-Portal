import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";
import { isPortalAdmin } from "@/lib/auth/roles";
import { getPortalOrigin } from "@/lib/host";

export const runtime = "nodejs";

type Body = {
  registrationId?: string;
  year?: number;
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
  if (!isPortalAdmin(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const registrationId = body.registrationId?.trim();
  if (!registrationId) {
    return NextResponse.json({ error: "registrationId required" }, { status: 400 });
  }

  const { data: reg } = await supabase
    .from("event_peak_registrations")
    .select("id, participant_name, household_label, registration_code, edition_id")
    .eq("id", registrationId)
    .maybeSingle();

  if (!reg) {
    return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  }

  const { data: winner } = await supabase
    .from("event_door_prize_winners")
    .select("id, prize_id, prize:event_door_prizes(name)")
    .eq("registration_id", registrationId)
    .maybeSingle();

  const prizeName =
    (winner as { prize?: { name?: string } | null } | null)?.prize?.name ?? "Door Prize";

  const { data: subs, error: subErr } = await supabase.rpc(
    "get_peak_push_subscriptions_for_registration",
    { p_registration_id: registrationId }
  );

  if (subErr) {
    return NextResponse.json({ error: subErr.message }, { status: 500 });
  }

  const list = (subs ?? []) as {
    endpoint: string;
    p256dh: string;
    auth: string;
  }[];

  if (list.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  const year = body.year ?? 2026;
  const url = `${getPortalOrigin()}/kegiatan/agustusan/${year}/daftar/sukses?code=${encodeURIComponent(
    (reg as { registration_code: string }).registration_code
  )}`;

  const payload = JSON.stringify({
    title: "🎉 Selamat!",
    body: `Anda menang ${prizeName} — ${(reg as { household_label: string }).household_label}`,
    url,
  });

  let sent = 0;
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
      /* ignore failed endpoints */
    }
  }

  return NextResponse.json({ ok: true, sent });
}
