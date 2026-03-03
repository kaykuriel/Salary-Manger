"use client";

import { useEffect, useState } from "react";
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
  // Starts at 0 (not yet mounted). Each increment remounts ReportsManager → fresh fetch.
  const [reportKey, setReportKey] = useState(0);

  useEffect(() => {
    getSession().then((s) => {
      if (!s) { router.replace("/login"); return; }
      setSession(s);
    });
  }, [router]);

  function openReports() {
    setReportKey((k) => k + 1);
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

      {/* Tab bar */}
      <div className="border-b border-[#1a1a1a] bg-[#080808]">
        <div className="max-w-2xl mx-auto px-4 flex">
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
      </div>

      {/* Dashboard panel — always mounted so saves keep working */}
      <div className={activeTab === "dashboard" ? "" : "hidden"}>
        <SalaryManager userId={session.userId} />
      </div>

      {/* Reports panel — lazy-mounted on first visit, remounted on each visit */}
      {reportKey > 0 && (
        <div className={activeTab === "reports" ? "" : "hidden"}>
          <ReportsManager key={reportKey} />
        </div>
      )}
    </div>
  );
}
