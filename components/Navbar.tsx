"use client";

import { useRouter, usePathname } from "next/navigation";
import { clearSession } from "@/lib/auth";
import type { Session } from "@/lib/auth";

export default function Navbar({ session }: { session: Session }) {
  const router = useRouter();
  const pathname = usePathname();

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  const isAdmin = pathname === "/admin";

  return (
    <header className="border-b border-[#1a1a1a] bg-[#080808] sticky top-0 z-10 backdrop-blur-sm">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-[#0070f3] flex-shrink-0" />
          <span className="text-sm font-semibold text-white tracking-tight">
            Salary Manager
          </span>
          <span className="text-[#333]">·</span>
          <span className="text-xs text-[#555] font-mono">{session.username}</span>
          {session.role === "admin" && (
            <span className="text-[10px] px-1.5 py-0.5 border border-[#0070f3]/30 text-[#0070f3] rounded font-mono">
              admin
            </span>
          )}
        </div>

        <nav className="flex items-center gap-0.5">
          {session.role === "admin" && (
            <button
              onClick={() => router.push("/admin")}
              className={`btn-ghost ${isAdmin ? "text-white bg-white/5" : ""}`}
            >
              Users
            </button>
          )}
          <button
            onClick={() => router.push("/dashboard")}
            className={`btn-ghost ${!isAdmin ? "text-white bg-white/5" : ""}`}
          >
            Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="btn-ghost hover:text-[#ff4444]"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
