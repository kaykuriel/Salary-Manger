import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { hashPassword, signSession, applySessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { username, password } = body ?? {};

  if (!username || !password) {
    return NextResponse.json({ ok: false, error: "All fields required." }, { status: 400 });
  }

  const { data: users } = await supabase
    .from("users")
    .select("id, username, password_hash, role")
    .ilike("username", username.trim())
    .limit(1);

  const user = users?.[0];
  if (!user) {
    return NextResponse.json({ ok: false, error: "User not found." }, { status: 401 });
  }

  const hash = await hashPassword(password);
  if (hash !== user.password_hash) {
    return NextResponse.json({ ok: false, error: "Incorrect password." }, { status: 401 });
  }

  const session = {
    userId: user.id as string,
    username: user.username as string,
    role: user.role as "admin" | "user",
  };

  const token = await signSession(session);
  const res = NextResponse.json({ ok: true, session });
  applySessionCookie(res, token);
  return res;
}
