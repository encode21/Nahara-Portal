import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPortalAdmin } from "@/lib/auth/roles";

export const runtime = "nodejs";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isPortalAdmin(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // basic validation
  if (body.title && typeof body.title === "string") body.title = body.title.trim();
  if (body.category && typeof body.category === "string") body.category = body.category.trim();

  const allowed: Record<string, boolean> = {
    edition_id: true,
    title: true,
    category: true,
    category_note: true,
    location: true,
    starts_at: true,
    ends_at: true,
    equipment: true,
    rules: true,
    team_size: true,
    max_entries: true,
    registration_open: true,
    is_competition: true,
    sort_order: true,
  };

  const payload: any = {};
  for (const k of Object.keys(body)) {
    if (allowed[k]) payload[k] = body[k];
  }

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("event_contests")
    .update(payload)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}
