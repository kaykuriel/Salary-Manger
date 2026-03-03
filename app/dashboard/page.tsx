"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import type { Session } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import SalaryManager from "@/components/SalaryManager";
import ReportsManager from "@/components/ReportsManager";

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "reports">("dashboard");
  const [reportMounted, setReportMounted] = useState(0);
  const [savedTick, setSavedTick] = useState(0);
  // "ok" | "fail" | null — visible in the tab bar regardless of active tab
  const [saveIndicator, setSaveIndicator] = useState<"ok" | "fail" | null>(null);

  useEffect(() => {
    getSession().then((s) => {
      if (!s) { router.replace("/login"); return; }
      setSession(s);
    });
  }, [router]);

  const handleSaved = useCallback(() => {
    setSavedTick((t) => t + 1);
    setSaveIndicator("ok");
    setTimeout(() => setSaveIndicator(null), 2500);
  }, []);

  const handleSaveFail = useCallback(() => {
    setSaveIndicator("fail");
  }, []);

  function openReports() {
    setReportMounted((m) => (m === 0 ? 1 : m));
    setActiveTab("reports");
  }

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

      {/* Tab bar + save indicator */}
      <div className="border-b border-[#1a1a1a] bg-[#080808]">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-between">
          <div className="flex">
            {(["dashboard", "reports"] as const).map((tab) => (
              <button
                key={tab}
                onClick={tab === "reports" ? openReports : () => setActiveTab("dashboard")}
                className={`text-xs font-mono py-2.5 px-4 border-b-2 capitalize transition-colors duration-150 ${
                  activeTab === tab
                    ? "border-[#cc0000] text-white"
                    : "border-transparent text-[#555] hover:text-[#888]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Save status — always visible, even when on Reports tab */}
          <div className="text-[10px] font-mono pr-1">
            {saveIndicator === "ok" && <span className="text-[#50e3c2]">saved ✓</span>}
            {saveIndicator === "fail" && (
              <span className="text-[#ff4444]">
                save failed — check Supabase connection
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard panel — always mounted so saves keep working */}
      <div className={activeTab === "dashboard" ? "" : "hidden"}>
        <SalaryManager
          userId={session.userId}
          onSaved={handleSaved}
          onSaveFail={handleSaveFail}
        />
      </div>

      {/* Reports panel — lazy-mounted on first visit, never remounted */}
      {reportMounted > 0 && (
        <div className={activeTab === "reports" ? "" : "hidden"}>
          <ReportsManager refreshTrigger={savedTick} />
        </div>
      )}
    </div>
  );
}
