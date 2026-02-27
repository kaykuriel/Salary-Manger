"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { logoutUser } from "@/lib/auth";
import type { Session } from "@/lib/auth";

const NAV = [
  { label: "Dashboard",   href: "/dashboard",   icon: "◈" },
  { label: "Investments", href: "/investments",  icon: "◎" },
  { label: "Converter",   href: "/converter",    icon: "⇄" },
];

export default function Navbar({ session }: { session: Session }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  async function handleLogout() {
    await logoutUser();
    router.push("/login");
  }

  function go(href: string) {
    router.push(href);
    setOpen(false);
  }

  return (
    <div ref={menuRef} className="sticky top-0 z-10">
      {/* Main bar */}
      <header className="border-b border-[#1a1a1a] bg-[#080808] backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left: identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#0070f3] flex-shrink-0" />
            <span className="text-sm font-semibold text-white tracking-tight truncate">
              Salary Manager
            </span>
            <span className="text-[#2a2a2a]">·</span>
            <span className="text-xs text-[#555] font-mono truncate">{session.username}</span>
            {session.role === "admin" && (
              <span className="text-[10px] px-1.5 py-0.5 border border-[#0070f3]/30 text-[#0070f3] rounded font-mono flex-shrink-0">
                admin
              </span>
            )}
          </div>

          {/* Right: hamburger */}
          <button
            onClick={() => setOpen((v) => !v)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all duration-150 active:scale-90 flex-shrink-0
              ${open
                ? "border-[#0070f3]/50 text-white bg-[#0070f3]/10"
                : "border-[#222] text-[#666] hover:text-white hover:border-[#444]"
              }`}
            aria-label="Menu"
          >
            {open ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                <path d="M0 1h16M0 6h16M0 11h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 bg-[#080808] border-b border-[#1a1a1a] shadow-2xl shadow-black/60">
          <div className="max-w-2xl mx-auto px-4 py-3 flex flex-col gap-1">
            {/* Nav items */}
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => go(item.href)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 text-left w-full
                    ${active
                      ? "bg-white/[0.06] text-white"
                      : "text-[#666] hover:text-white hover:bg-white/[0.04]"
                    }`}
                >
                  <span className="text-base w-5 text-center opacity-60">{item.icon}</span>
                  {item.label}
                  {active && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0070f3]" />
                  )}
                </button>
              );
            })}

            {session.role === "admin" && (
              <button
                onClick={() => go("/admin")}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 text-left w-full
                  ${pathname === "/admin"
                    ? "bg-white/[0.06] text-white"
                    : "text-[#666] hover:text-white hover:bg-white/[0.04]"
                  }`}
              >
                <span className="text-base w-5 text-center opacity-60">⊕</span>
                Users
                {pathname === "/admin" && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0070f3]" />
                )}
              </button>
            )}

            {/* Divider */}
            <div className="h-px bg-[#1a1a1a] my-1" />

            {/* Sign out */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#666] hover:text-[#ff4444] hover:bg-[#ff4444]/[0.06] transition-all duration-150 text-left w-full"
            >
              <span className="text-base w-5 text-center opacity-60">→</span>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
