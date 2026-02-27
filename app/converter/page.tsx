"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import type { Session } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import CurrencyConverter from "@/components/CurrencyConverter";

export default function ConverterPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    getSession().then((s) => {
      if (!s) { router.replace("/login"); return; }
      setSession(s);
    });
  }, [router]);

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
      <CurrencyConverter />
    </div>
  );
}
