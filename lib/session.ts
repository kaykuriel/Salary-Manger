import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

// Server-only session utilities. Never import in client components.

export const SESSION_COOKIE = "sm_session";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-please-change-in-production"
);

export type SessionPayload = {
  userId: string;
  username: string;
  role: "admin" | "user";
};

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(SECRET);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export function applySessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.delete(SESSION_COOKIE);
}

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode("slmgr:" + password);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
