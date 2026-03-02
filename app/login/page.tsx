"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUser, getSession } from "@/lib/auth";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const registered = params.get("registered") === "1";

  useEffect(() => {
    getSession().then((s) => { if (s) router.replace("/dashboard"); });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) { setError("All fields required."); return; }
    setError(""); setLoading(true);
    const res = await loginUser(username, password);
    setLoading(false);
    if (res.ok) { router.push("/dashboard"); } else { setError(res.error ?? "Authentication failed."); }
  }

  return (
    <div className="w-full max-w-[360px] flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#cc0000] flex items-center justify-center mb-1">
          <span className="text-white text-sm font-bold">$</span>
        </div>
        <h1 className="text-xl font-semibold text-white tracking-tight">Sign in</h1>
        <p className="text-sm text-[#555]">Enter your credentials to continue</p>
      </div>

      {registered && (
        <div className="px-4 py-2.5 bg-[#cc0000]/10 border border-[#cc0000]/30 rounded-lg text-xs text-[#cc0000] text-center">
          Account created! Sign in below.
        </div>
      )}

      <div className="card p-6 flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono uppercase tracking-widest text-[#555]">Username</label>
            <input type="text" value={username} onChange={(e) => { setUsername(e.target.value); setError(""); }} placeholder="your username" autoComplete="username" autoFocus className="field" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono uppercase tracking-widest text-[#555]">Password</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} placeholder="••••••••" autoComplete="current-password" className="field pr-16" />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-white text-xs transition-colors select-none" tabIndex={-1}>
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          {error && <p className="text-[#ff4444] text-xs -mt-1">{error}</p>}
          <button type="submit" disabled={loading} className="btn w-full justify-center py-2.5 mt-1 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-[#555]">
        No account?{" "}
        <a href="/register" className="text-[#cc0000] hover:underline">Create one</a>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Suspense fallback={null}><LoginForm /></Suspense>
    </div>
  );
}
