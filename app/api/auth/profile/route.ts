import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getSessionFromRequest, hashPassword, signSession, applySessionCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json(null, { status: 401 });

  const { data } = await supabase
    .from("users")
    .select("username, avatar")
    .eq("id", session.userId)
    .single();

  return NextResponse.json({
    username: data?.username ?? session.username,
    avatar: data?.avatar ?? null,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { username, currentPassword, newPassword, avatar } = body as {
    username?: string;
    currentPassword?: string;
    newPassword?: string;
    avatar?: string | null;
  };

  const updates: Record<string, unknown> = {};

  // Username change
  if (username && username.trim() !== session.username) {
    const trimmed = username.trim();
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .ilike("username", trimmed)
      .neq("id", session.userId)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ ok: false, error: "Username already taken." }, { status: 400 });
    }
    updates.username = trimmed;
  }

  // Password change
  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ ok: false, error: "Current password is required." }, { status: 400 });
    }
    if (newPassword.length < 4) {
      return NextResponse.json({ ok: false, error: "New password must be at least 4 characters." }, { status: 400 });
    }
    const currentHash = await hashPassword(currentPassword);
    const { data: user } = await supabase
      .from("users")
      .select("password_hash")
      .eq("id", session.userId)
      .single();
    if (!user || user.password_hash !== currentHash) {
      return NextResponse.json({ ok: false, error: "Current password is incorrect." }, { status: 400 });
    }
    updates.password_hash = await hashPassword(newPassword);
  }

  // Avatar
  if (avatar !== undefined) {
    updates.avatar = avatar;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase.from("users").update(updates).eq("id", session.userId);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Re-sign JWT if username changed
  const res = NextResponse.json({ ok: true });
  if (updates.username) {
    const newToken = await signSession({
      userId: session.userId,
      username: updates.username as string,
      role: session.role,
    });
    applySessionCookie(res, newToken);
  }

  return res;
}
