"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import type { Session } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import SalaryManager from "@/components/SalaryManager";

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace("/login"); return; }
    setSession(s);
  }, [router]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-app-muted text-xs tracking-widest cursor">
          &gt; Loading
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg">
      <Navbar session={session} />
      <SalaryManager userId={session.userId} />
    </div>
  );
}
