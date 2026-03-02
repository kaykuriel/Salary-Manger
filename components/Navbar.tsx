"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { logoutUser, getProfile } from "@/lib/auth";
import type { Session } from "@/lib/auth";

const NAV = [
  { label: "Dashboard", href: "/dashboard", icon: "◈" },
  { label: "Reports",   href: "/reports",   icon: "◎" },
  { label: "Converter", href: "/converter", icon: "⇄" },
];

export default function Navbar({ session }: { session: Session }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getProfile().then((p) => { if (p?.avatar) setAvatar(p.avatar); });
  }, []);

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
      <header className="border-b border-[#1a0000] bg-[#050000] backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left: identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#cc0000] flex-shrink-0" />
            <span className="text-sm font-semibold text-white tracking-tight truncate">
              Salary Manager
            </span>
            <span className="text-[#2a0000]">·</span>
            <span className="text-xs text-[#555] font-mono truncate">{session.username}</span>
            {session.role === "admin" && (
              <span className="text-[10px] px-1.5 py-0.5 border border-[#cc0000]/30 text-[#cc0000] rounded font-mono flex-shrink-0">
                admin
              </span>
            )}
          </div>

          {/* Right: avatar + hamburger */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => go("/profile")}
              className="w-8 h-8 rounded-full overflow-hidden border border-[#280000] hover:border-[#cc0000] transition-colors duration-150 flex-shrink-0"
              aria-label="Profile"
            >
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#0a0000] flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-[#555]">
                    {session.username.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => setOpen((v) => !v)}
              className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all duration-150 active:scale-90 flex-shrink-0
                ${open
                  ? "border-[#cc0000]/50 text-white bg-[#cc0000]/10"
                  : "border-[#280000] text-[#666] hover:text-white hover:border-[#3a0000]"
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
        </div>
      </header>

      {/* Dropdown — compact card anchored to the hamburger button */}
      {open && (
        <div className="absolute right-4 top-[calc(100%+6px)] w-52 bg-[#060000] border border-[#280000] rounded-xl shadow-2xl shadow-black/80 overflow-hidden">
          <div className="p-1.5 flex flex-col gap-0.5">
            {/* Nav items */}
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => go(item.href)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 text-left w-full
                    ${active
                      ? "bg-white/[0.07] text-white"
                      : "text-[#666] hover:text-white hover:bg-white/[0.04]"
                    }`}
                >
                  <span className="text-base w-5 text-center opacity-60">{item.icon}</span>
                  {item.label}
                  {active && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#cc0000]" />
                  )}
                </button>
              );
            })}

            {session.role === "admin" && (
              <button
                onClick={() => go("/admin")}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 text-left w-full
                  ${pathname === "/admin"
                    ? "bg-white/[0.07] text-white"
                    : "text-[#666] hover:text-white hover:bg-white/[0.04]"
                  }`}
              >
                <span className="text-base w-5 text-center opacity-60">⊕</span>
                Users
                {pathname === "/admin" && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#cc0000]" />
                )}
              </button>
            )}

            {/* Profile */}
            <button
              onClick={() => go("/profile")}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 text-left w-full
                ${pathname === "/profile"
                  ? "bg-white/[0.07] text-white"
                  : "text-[#666] hover:text-white hover:bg-white/[0.04]"
                }`}
            >
              <span className="text-base w-5 text-center opacity-60">◉</span>
              Profile
              {pathname === "/profile" && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#cc0000]" />
              )}
            </button>

            {/* Divider */}
            <div className="h-px bg-[#1a0000] my-1" />

            {/* Sign out */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#666] hover:text-[#ff2222] hover:bg-[#ff2222]/[0.06] transition-all duration-150 text-left w-full"
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
