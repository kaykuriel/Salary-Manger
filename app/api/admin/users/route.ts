import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json([], { status: 403 });
  }

  const { data } = await supabase
    .from("users")
    .select("id, username, role, created_at, avatar")
    .order("created_at", { ascending: true });

  const users = (data ?? []).map((u) => ({
    id: u.id,
    username: u.username,
    role: u.role,
    createdAt: u.created_at,
    avatar: u.avatar ?? null,
  }));

  return NextResponse.json(users);
}
