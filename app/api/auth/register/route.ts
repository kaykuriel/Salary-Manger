import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { hashPassword, getSessionFromRequest } from "@/lib/session";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { username, password, role } = body ?? {};

  if (!username?.trim() || !password) {
    return NextResponse.json({ ok: false, error: "Username and password required." }, { status: 400 });
  }

  const trimmed = username.trim();
  if (trimmed.length < 3) {
    return NextResponse.json({ ok: false, error: "Username must be at least 3 characters." }, { status: 400 });
  }
  if (password.length < 4) {
    return NextResponse.json({ ok: false, error: "Password must be at least 4 characters." }, { status: 400 });
  }

  // Check username taken (case-insensitive via index)
  const { data: existing, error: checkError } = await supabase
    .from("users")
    .select("id")
    .ilike("username", trimmed)
    .limit(1);

  if (checkError) {
    return NextResponse.json({ ok: false, error: "Server error. Please try again." }, { status: 503 });
  }

  if (existing && existing.length > 0) {
    return NextResponse.json({ ok: false, error: "An account with that username already exists." }, { status: 409 });
  }

  // Count existing users to determine if this is the first registration
  const { count, error: countError } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true });

  if (countError) {
    return NextResponse.json({ ok: false, error: "Server error. Please try again." }, { status: 503 });
  }

  let assignedRole: "admin" | "user" = count === 0 ? "admin" : "user";

  // Admin can override the role
  if (role && role !== assignedRole) {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Only admins can assign roles." }, { status: 403 });
    }
    if (role === "admin" || role === "user") assignedRole = role;
  }

  const passwordHash = await hashPassword(password);

  const { error: insertError } = await supabase.from("users").insert({
    username: trimmed,
    password_hash: passwordHash,
    role: assignedRole,
  });

  if (insertError) {
    return NextResponse.json({ ok: false, error: "Failed to create account. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
