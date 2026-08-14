import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPortalAdmin } from "@/lib/auth/roles";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isPortalAdmin(user)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: row, error: selErr } = await supabase.from("event_contests").select("*").eq("id", id).maybeSingle();
  if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Best-effort: insert a backup copy into event_contests_backups (may not exist).
  const { data, error } = await supabase.from("event_contests_backups").insert({ original_id: id, payload: row }).select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}
