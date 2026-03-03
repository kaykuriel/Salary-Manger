"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import type { Session } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import SalaryManager from "@/components/SalaryManager";

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [saveIndicator, setSaveIndicator] = useState<"ok" | "fail" | null>(null);

  useEffect(() => {
    getSession().then((s) => {
      if (!s) { router.replace("/login"); return; }
      setSession(s);
    });
  }, [router]);

  const handleSaved = useCallback(() => {
    setSaveIndicator("ok");
    setTimeout(() => setSaveIndicator(null), 2500);
  }, []);

  const handleSaveFail = useCallback(() => {
    setSaveIndicator("fail");
  }, []);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#555] text-xs">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar session={session} />
      {saveIndicator && (
        <div className={`text-center py-1 text-[10px] font-mono ${saveIndicator === "ok" ? "text-[#50e3c2]" : "text-[#ff4444]"}`}>
          {saveIndicator === "ok" ? "saved ✓" : "save failed — check Supabase connection"}
        </div>
      )}
      <SalaryManager
        userId={session.userId}
        onSaved={handleSaved}
        onSaveFail={handleSaveFail}
      />
    </div>
  );
}
