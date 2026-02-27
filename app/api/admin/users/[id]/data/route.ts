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
    result[row.month_key as string] = {
      salary: Number(row.salary),
      categories: row.categories as { amount: number }[],
    };
  }

  return NextResponse.json(result);
}
