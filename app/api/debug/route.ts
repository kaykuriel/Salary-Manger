import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";

export const dynamic = "force-dynamic";

// Diagnostic endpoint: tests DB connectivity and write ability for the current user.
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // 1. Check if the user row exists in `users`
  const { data: userRow, error: userErr } = await supabase
    .from("users")
    .select("id, username")
    .eq("id", session.userId)
    .single();

  // 2. Count rows in salary_data for this user
  const { count, error: countErr } = await supabase
    .from("salary_data")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.userId);

  // 3. Try a test write: upsert a sentinel row, then read it back
  const testKey = "__debug_test__";
  const { error: writeErr } = await supabase.from("salary_data").upsert(
    { user_id: session.userId, month_key: testKey, salary: 0, categories: { items: [], extras: [] } },
    { onConflict: "user_id,month_key" }
  );

  let writeVerified = false;
  if (!writeErr) {
    const { data: readBack } = await supabase
      .from("salary_data")
      .select("month_key")
      .eq("user_id", session.userId)
      .eq("month_key", testKey)
      .single();
    writeVerified = !!readBack;
    // Clean up test row
    await supabase.from("salary_data").delete().eq("user_id", session.userId).eq("month_key", testKey);
  }

  // 4. Fetch the actual rows so we can see what's stored
  const { data: rows } = await supabase
    .from("salary_data")
    .select("month_key, salary, categories")
    .eq("user_id", session.userId)
    .order("month_key", { ascending: true });

  const rowSummary = (rows ?? []).map((r) => {
    const raw = r.categories;
    const isLegacy = Array.isArray(raw);
    const items = isLegacy ? raw : (raw?.items ?? []);
    const extras = isLegacy ? [] : (raw?.extras ?? []);
    return {
      month_key: r.month_key,
      salary: Number(r.salary),
      categories: items.length,
      extras: extras.length,
    };
  });

  return NextResponse.json({
    userId: session.userId,
    username: session.username,
    userExistsInDB: !!userRow,
    userDBError: userErr?.message ?? null,
    savedRowCount: count ?? 0,
    savedRowCountError: countErr?.message ?? null,
    writeTest: writeErr ? `FAILED: ${writeErr.message}` : "OK",
    writeVerified,
    rows: rowSummary,
  });
}
