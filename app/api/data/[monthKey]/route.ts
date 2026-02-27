import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";

type Ctx = { params: { monthKey: string } };

export async function GET(req: NextRequest, { params }: Ctx) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json(null, { status: 401 });

  const { data } = await supabase
    .from("salary_data")
    .select("salary, categories")
    .eq("user_id", session.userId)
    .eq("month_key", params.monthKey)
    .limit(1);

  const row = data?.[0];
  return NextResponse.json(row ? { salary: Number(row.salary), categories: row.categories } : { salary: 0, categories: [] });
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json(null, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const salary = Number(body.salary) || 0;
  const categories = Array.isArray(body.categories) ? body.categories : [];

  await supabase.from("salary_data").upsert(
    {
      user_id: session.userId,
      month_key: params.monthKey,
      salary,
      categories,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,month_key" }
  );

  return NextResponse.json({ ok: true });
}
