import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Ctx) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({}, { status: 403 });
  }

  const { data } = await supabase
    .from("salary_data")
    .select("month_key, salary, categories")
    .eq("user_id", params.id)
    .order("month_key", { ascending: false });

  const result: Record<string, { salary: number; categories: { amount: number }[] }> = {};
  for (const row of data ?? []) {
    // Skip internal keys (e.g. investments calculator)
    if ((row.month_key as string).startsWith("__")) continue;
    // Normalize: categories may be a plain array (old) or { items, extras } (new)
    const raw = row.categories as { items?: { amount: number }[] } | { amount: number }[] | null;
    const cats: { amount: number }[] = Array.isArray(raw) ? raw : ((raw as { items?: { amount: number }[] })?.items ?? []);
    result[row.month_key as string] = {
      salary: Number(row.salary),
      categories: cats,
    };
  }

  return NextResponse.json(result);
}
