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
    getSession().then((s) => {
      if (!s) { router.replace("/login"); return; }
      if (s.role !== "admin") { router.replace("/dashboard"); return; }
      setSession(s);
    });
  }, [router]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#555] text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar session={session} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-xs font-mono uppercase tracking-widest text-[#555] mb-1">Admin</p>
          <h1 className="text-2xl font-semibold text-white tracking-tight">User management</h1>
        </div>
        <AdminPanel currentUserId={session.userId} />
      </main>
    </div>
  );
}
