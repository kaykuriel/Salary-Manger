import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export const dynamic = "force-dynamic";

// Public endpoint: returns whether any users exist yet.
// Used by the register page to show "First account will be admin".
export async function GET() {
  const { count } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true });
  return NextResponse.json({ isFirst: count === 0 });
}
