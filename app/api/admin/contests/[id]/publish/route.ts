import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPortalAdmin } from "@/lib/auth/roles";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isPortalAdmin(user)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Try to read current value — note: event_contests may not have is_published column in older schemas
  const { data: current, error: selErr } = await supabase.from("event_contests").select("id, is_published").eq("id", id).maybeSingle();
  if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newVal = !((current as any).is_published === true);
  const { data, error } = await supabase.from("event_contests").update({ is_published: newVal }).eq("id", id).select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}
