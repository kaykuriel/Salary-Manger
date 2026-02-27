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
  if (!row) return NextResponse.json({ salary: 0, categories: [], extras: [] });

  // Backward compat: categories column may be a plain array (old data)
  // or { items: Category[], extras: Extra[] } (new format)
  const raw = row.categories;
  const isLegacy = Array.isArray(raw);
  const categories = isLegacy ? raw : (raw?.items ?? []);
  const extras = isLegacy ? [] : (raw?.extras ?? []);

  return NextResponse.json({ salary: Number(row.salary), categories, extras });
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json(null, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const salary = Number(body.salary) || 0;
  const categories = Array.isArray(body.categories) ? body.categories : [];
  const extras = Array.isArray(body.extras) ? body.extras : [];

  await supabase.from("salary_data").upsert(
    {
      user_id: session.userId,
      month_key: params.monthKey,
      salary,
      categories: { items: categories, extras },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,month_key" }
  );

  return NextResponse.json({ ok: true });
}
