"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import type { Session } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import AdminPanel from "@/components/AdminPanel";

export default function AdminPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace("/login"); return; }
    if (s.role !== "admin") { router.replace("/dashboard"); return; }
    setSession(s);
  }, [router]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-app-muted text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg">
      <Navbar session={session} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-xs font-mono uppercase tracking-widest text-app-muted mb-1">Admin</p>
          <h1 className="text-2xl font-semibold text-app-text tracking-tight">User management</h1>
        </div>
        <AdminPanel currentUserId={session.userId} />
      </main>
    </div>
  );
}
