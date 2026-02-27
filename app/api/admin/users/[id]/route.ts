import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getSessionFromRequest, hashPassword } from "@/lib/session";

type Ctx = { params: { id: string } };

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  if (params.id === session.userId) {
    return NextResponse.json({ ok: false, error: "Cannot delete your own account." }, { status: 400 });
  }

  await supabase.from("users").delete().eq("id", params.id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { password } = body as { password?: string };

  if (!password || password.length < 4) {
    return NextResponse.json({ ok: false, error: "Password must be at least 4 characters." }, { status: 400 });
  }

  const password_hash = await hashPassword(password);
  const { error } = await supabase
    .from("users")
    .update({ password_hash })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
