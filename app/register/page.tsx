"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createUser, getSession, getUsers } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFirst, setIsFirst] = useState(false);

  useEffect(() => {
    if (getSession()) { router.replace("/dashboard"); return; }
    setIsFirst(getUsers().length === 0);
  }, [router]);

  function clear() { setError(""); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const u = username.trim();
    if (!u || !password)       { setError("All fields are required."); return; }
    if (u.length < 3)          { setError("Username must be at least 3 characters."); return; }
    if (password.length < 4)   { setError("Password must be at least 4 characters."); return; }
    if (password !== confirm)  { setError("Passwords do not match."); return; }

    setLoading(true);
    const res = await createUser(u, password);
    setLoading(false);
    if (!res.ok) { setError(res.error ?? "Failed."); return; }

    // Go to login so the user signs in manually
    router.push("/login?registered=1");
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-[360px] flex flex-col gap-6">

        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0070f3] flex items-center justify-center mb-1">
            <span className="text-white text-sm font-bold">$</span>
          </div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Create account</h1>
          <p className="text-sm text-[#555]">
            {isFirst ? "First account will be admin" : "Join to track your finances"}
          </p>
        </div>

        <div className="card p-6 flex flex-col gap-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono uppercase tracking-widest text-[#555]">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); clear(); }}
                placeholder="min. 3 characters"
                autoComplete="username"
                autoFocus
                className="field"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono uppercase tracking-widest text-[#555]">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clear(); }}
                  placeholder="min. 4 characters"
                  autoComplete="new-password"
                  className="field pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-white text-xs transition-colors select-none"
                  tabIndex={-1}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono uppercase tracking-widest text-[#555]">Confirm password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); clear(); }}
                  placeholder="repeat password"
                  autoComplete="new-password"
                  className="field pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-white text-xs transition-colors select-none"
                  tabIndex={-1}
                >
                  {showConfirm ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && <p className="text-[#ff4444] text-xs -mt-1">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn w-full justify-center py-2.5 mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#555]">
          Already have an account?{" "}
          <a href="/login" className="text-[#0070f3] hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
