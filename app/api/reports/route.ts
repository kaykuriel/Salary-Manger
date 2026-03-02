import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json(null, { status: 401 });

  const { data, error } = await supabase
    .from("salary_data")
    .select("month_key, salary, categories")
    .eq("user_id", session.userId)
    .neq("month_key", "__inv__")
    .order("month_key", { ascending: true });

  if (error || !data) return NextResponse.json({ months: [] });

  const months = data
    .map((row) => {
      const raw = row.categories;
      const isLegacy = Array.isArray(raw);
      const categories = isLegacy ? raw : (raw?.items ?? []);
      const extras = isLegacy ? [] : (raw?.extras ?? []);
      return {
        monthKey: row.month_key,
        salary: Number(row.salary) || 0,
        categories,
        extras,
      };
    })
    // Skip months with no data at all
    .filter((m) => m.salary > 0 || m.categories.length > 0 || m.extras.length > 0);

  return NextResponse.json({ months });
}
