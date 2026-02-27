import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";

export const dynamic = "force-dynamic";

const INV_KEY = "__inv__";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json(null, { status: 401 });

  const { data } = await supabase
    .from("salary_data")
    .select("categories")
    .eq("user_id", session.userId)
    .eq("month_key", INV_KEY)
    .limit(1);

  const raw = data?.[0]?.categories;
  const investments = Array.isArray(raw?.investments) ? raw.investments : [];
  return NextResponse.json({ investments });
}

export async function PUT(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json(null, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const investments = Array.isArray(body.investments) ? body.investments : [];

  await supabase.from("salary_data").upsert(
    {
      user_id: session.userId,
      month_key: INV_KEY,
      salary: 0,
      categories: { investments },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,month_key" }
  );

  return NextResponse.json({ ok: true });
}
