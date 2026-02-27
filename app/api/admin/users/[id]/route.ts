import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";

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
