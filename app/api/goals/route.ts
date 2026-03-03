import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";

const GOALS_KEY = "__goals__";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json(null, { status: 401 });

  const { data } = await supabase
    .from("salary_data")
    .select("categories")
    .eq("user_id", session.userId)
    .eq("month_key", GOALS_KEY)
    .single();

  const goals = (data?.categories as { goals?: unknown[] } | null)?.goals ?? [];
  return NextResponse.json({ goals });
}

export async function PUT(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json(null, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const goals = Array.isArray(body.goals) ? body.goals : [];

  const { error } = await supabase.from("salary_data").upsert(
    { user_id: session.userId, month_key: GOALS_KEY, salary: 0, categories: { goals } },
    { onConflict: "user_id,month_key" }
  );

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
