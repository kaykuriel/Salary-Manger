"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
        <div className="w-10 h-10 rounded-xl bg-[#ff4444]/10 border border-[#ff4444]/30 flex items-center justify-center">
          <span className="text-[#ff4444] text-lg">!</span>
        </div>
        <div>
          <h1 className="text-white font-semibold text-lg mb-1">Something went wrong</h1>
          <p className="text-[#555] text-sm">An unexpected error occurred.</p>
          {error?.message && (
            <p className="text-[#444] text-xs mt-3 font-mono bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-left break-all">
              {error.message}
            </p>
          )}
        </div>
        <button
          onClick={reset}
          className="btn px-6"
        >
          Try again
        </button>
        <a href="/dashboard" className="text-xs text-[#555] hover:text-white transition-colors">
          ← Back to dashboard
        </a>
      </div>
    </div>
  );
}
