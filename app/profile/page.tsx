"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import type { Session } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import ProfileEditor from "@/components/ProfileEditor";

export default function ProfilePage() {
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
      <div className="max-w-2xl mx-auto">
        <div className="px-4 pt-8 pb-2">
          <h1 className="text-lg font-semibold text-white">Profile</h1>
          <p className="text-xs text-[#555] mt-0.5">Manage your account settings</p>
        </div>
        <ProfileEditor username={session.username} />
      </div>
    </div>
  );
}
