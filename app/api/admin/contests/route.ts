import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPortalAdmin } from "@/lib/auth/roles";

export const runtime = "nodejs";

type CreateBody = {
  edition_id: string;
  title: string;
  category: string;
  category_note?: string | null;
  location?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  equipment?: string | null;
  rules?: string | null;
  team_size?: number;
  max_entries?: number | null;
  registration_open?: boolean;
  is_competition?: boolean;
};

function validateRequired(body: CreateBody) {
  if (!body.title || !body.title.trim()) return "title required";
  if (!body.category || !body.category.trim()) return "category required";
  if (!body.starts_at || !body.ends_at) return "starts_at and ends_at required";
  return null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const edition = url.searchParams.get("edition_id");
  const category = url.searchParams.get("category");

  const supabase = createClient();
  const { data, error } = await supabase
    .from("event_contests")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let items = data ?? [];
  if (edition) items = (items as any[]).filter((i) => i.edition_id === edition);
  if (category) items = (items as any[]).filter((i) => i.category === category);

  return NextResponse.json({ ok: true, data: items });
}

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isPortalAdmin(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const v = validateRequired(body);
  if (v) return NextResponse.json({ error: v }, { status: 400 });

  const payload = {
    edition_id: body.edition_id,
    title: body.title?.trim(),
    category: body.category?.trim(),
    category_note: body.category_note?.trim?.() ?? null,
    location: body.location?.trim?.() ?? null,
    starts_at: body.starts_at ?? null,
    ends_at: body.ends_at ?? null,
    equipment: body.equipment?.trim?.() ?? null,
    rules: body.rules?.trim?.() ?? null,
    team_size: body.team_size ?? 1,
    max_entries: body.max_entries ?? null,
    registration_open: body.registration_open ?? true,
    is_competition: body.is_competition ?? true,
  } as any;

  const { data: inserted, error } = await supabase.from("event_contests").insert(payload).select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, data: inserted });
}
