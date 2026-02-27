"use client";

import { useRouter, usePathname } from "next/navigation";
import { logoutUser } from "@/lib/auth";
import type { Session } from "@/lib/auth";

const NAV = [
  { label: "Dashboard",   href: "/dashboard"   },
  { label: "Investments", href: "/investments"  },
  { label: "Converter",   href: "/converter"   },
];

export default function Navbar({ session }: { session: Session }) {
  const router   = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await logoutUser();
    router.push("/login");
  }

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
              className={`btn-ghost ${pathname === "/admin" ? "text-white bg-white/5" : ""}`}
            >
              Users
            </button>
          )}
          {NAV.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`btn-ghost ${pathname === item.href ? "text-white bg-white/5" : ""}`}
            >
              {item.label}
            </button>
          ))}
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
