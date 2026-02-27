"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type Investment = {
  id: string;
  name: string;
  category: string;
  invested: number;
  current: number;
};

const CATEGORIES = ["Stocks", "Crypto", "Real Estate", "Bonds", "ETF", "Other"] as const;

const CATEGORY_COLORS: Record<string, string> = {
  Stocks:        "#0070f3",
  Crypto:        "#f5a623",
  "Real Estate": "#50e3c2",
  Bonds:         "#7928ca",
  ETF:           "#06d6a0",
  Other:         "#888888",
};

function fmt(v: number) {
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(v: number) {
  return (v >= 0 ? "+" : "") + v.toFixed(2) + "%";
}

export default function InvestmentsManager() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const justLoadedRef = useRef(false);
  const isReloadRef = useRef(false);
  const [fetchKey, setFetchKey] = useState(0);

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Stocks");
  const [investedRaw, setInvestedRaw] = useState("");
  const [currentRaw, setCurrentRaw] = useState("");
  const [formError, setFormError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(() => {
    isReloadRef.current = true;
    setFetchKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const isReload = isReloadRef.current;
    isReloadRef.current = false;

    if (!isReload) setHydrated(false);
    else setLoading(true);

    justLoadedRef.current = false;

    fetch("/api/investments")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        justLoadedRef.current = true;
        setInvestments(Array.isArray(data?.investments) ? data.investments : []);
        setHydrated(true);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        justLoadedRef.current = true;
        setInvestments([]);
        setHydrated(true);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [fetchKey]);

  useEffect(() => {
    if (!hydrated) return;
    if (justLoadedRef.current) { justLoadedRef.current = false; return; }
    const timer = setTimeout(() => {
      fetch("/api/investments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investments }),
      }).catch(() => {});
    }, 600);
    return () => clearTimeout(timer);
  }, [investments, hydrated]);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    const inv = parseFloat(investedRaw.replace(/,/g, ""));
    const cur = parseFloat(currentRaw.replace(/,/g, ""));
    if (!trimmed) { setFormError("Name is required."); return; }
    if (isNaN(inv) || inv < 0) { setFormError("Enter a valid invested amount."); return; }
    if (isNaN(cur) || cur < 0) { setFormError("Enter a valid current value."); return; }

    setInvestments((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: trimmed, category, invested: inv, current: cur },
    ]);
    setName("");
    setInvestedRaw("");
    setCurrentRaw("");
    setFormError("");
    setTimeout(() => nameRef.current?.focus(), 0);
  }

  function handleDelete(id: string) {
    setInvestments((prev) => prev.filter((i) => i.id !== id));
  }

  function handleBlockBadKeys(e: React.KeyboardEvent<HTMLInputElement>) {
    if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
  }

  const totalInvested = investments.reduce((s, i) => s + i.invested, 0);
  const totalCurrent  = investments.reduce((s, i) => s + i.current, 0);
  const totalPnL      = totalCurrent - totalInvested;
  const totalPnLPct   = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const isGain        = totalPnL >= 0;

  if (!hydrated) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <span className="text-[#555] text-sm">Loading…</span>
      </main>
    );
  }

  return (
    <main className="py-8 px-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-center gap-2 py-1">
          <span className="text-base font-semibold text-white tracking-tight select-none">
            Investments
          </span>
          <button
            onClick={reload}
            disabled={loading}
            className={`w-6 h-6 flex items-center justify-center rounded text-base transition-all active:scale-90 ${loading ? "animate-spin text-[#0070f3]" : "text-[#333] hover:text-[#888]"}`}
            title="Reload"
          >
            ↻
          </button>
        </div>

        {/* Portfolio summary */}
        {investments.length > 0 && (
          <>
            <div className={`card p-6 ${!isGain ? "border-[#ff4444]/30 bg-[#ff4444]/[0.04]" : "hover:border-[#444]"}`}>
              <p className="text-xs font-mono uppercase tracking-widest text-[#666] mb-1.5">
                {isGain ? "Total Gain" : "Total Loss"}
              </p>
              <p className={`text-5xl font-semibold tabular-nums tracking-tight leading-none ${isGain ? "text-[#50e3c2]" : "text-[#ff4444]"}`}>
                {isGain ? "+" : "-"}${fmt(Math.abs(totalPnL))}
              </p>
              <p className="text-sm mt-2" style={{ color: isGain ? "#50e3c2" : "#ff4444" }}>
                {fmtPct(totalPnLPct)} on ${fmt(totalInvested)} invested
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="card p-5 hover:border-[#444]">
                <p className="text-xs font-mono uppercase tracking-widest text-[#666] mb-1.5">Invested</p>
                <p className="text-2xl font-semibold tabular-nums text-white">${fmt(totalInvested)}</p>
                <p className="text-xs text-[#555] mt-1">{investments.length} {investments.length === 1 ? "position" : "positions"}</p>
              </div>
              <div className="card p-5 hover:border-[#444]">
                <p className="text-xs font-mono uppercase tracking-widest text-[#666] mb-1.5">Current Value</p>
                <p className="text-2xl font-semibold tabular-nums text-white">${fmt(totalCurrent)}</p>
                <p className="text-xs text-[#555] mt-1">{isGain ? "↑" : "↓"} {Math.abs(totalPnLPct).toFixed(1)}%</p>
              </div>
            </div>
          </>
        )}

        {/* Add investment form */}
        <div className="card p-5 hover:border-[#444]">
          <p className="text-xs font-mono uppercase tracking-widest text-[#666] mb-4">
            Add Investment
          </p>
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                ref={nameRef}
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); if (formError) setFormError(""); }}
                placeholder="Apple, Bitcoin, S&P 500…"
                className="field flex-1"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="field w-36 flex-shrink-0 cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] text-sm select-none pointer-events-none">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={investedRaw}
                  onChange={(e) => { setInvestedRaw(e.target.value); if (formError) setFormError(""); }}
                  onKeyDown={handleBlockBadKeys}
                  placeholder="Invested"
                  className="field !pl-7"
                />
              </div>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] text-sm select-none pointer-events-none">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={currentRaw}
                  onChange={(e) => { setCurrentRaw(e.target.value); if (formError) setFormError(""); }}
                  onKeyDown={handleBlockBadKeys}
                  placeholder="Current value"
                  className="field !pl-7"
                />
              </div>
              <button type="submit" className="btn flex-shrink-0">Add</button>
            </div>
            {formError && <p className="text-[#ff4444] text-xs">{formError}</p>}
          </form>
        </div>

        {/* Holdings list */}
        {investments.length > 0 && (
          <div className="card overflow-hidden hover:border-[#444]">
            <div className="px-5 py-3 border-b border-[#222] flex justify-between items-center">
              <p className="text-xs font-mono uppercase tracking-widest text-[#666]">Holdings</p>
              <p className="text-xs text-[#555]">
                {investments.length} {investments.length === 1 ? "position" : "positions"}
              </p>
            </div>
            <ul>
              {investments.map((inv, i) => {
                const pnl    = inv.current - inv.invested;
                const pnlPct = inv.invested > 0 ? (pnl / inv.invested) * 100 : 0;
                const gain   = pnl >= 0;
                const color  = CATEGORY_COLORS[inv.category] ?? "#888";
                const pctOfPortfolio = totalCurrent > 0 ? (inv.current / totalCurrent) * 100 : 0;

                return (
                  <li
                    key={inv.id}
                    className={`px-5 py-4 group hover:bg-white/[0.02] transition-colors duration-150 ${i > 0 ? "border-t border-[#1a1a1a]" : ""}`}
                  >
                    {/* Top row: name + P&L + delete */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-sm text-white truncate font-medium">{inv.name}</span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded border font-mono flex-shrink-0"
                          style={{ color, borderColor: `${color}40` }}
                        >
                          {inv.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className="text-sm font-semibold tabular-nums"
                          style={{ color: gain ? "#50e3c2" : "#ff4444" }}
                        >
                          {gain ? "+" : "-"}${fmt(Math.abs(pnl))}
                        </span>
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="opacity-0 group-hover:opacity-100 text-[#555] hover:text-[#ff4444] transition-all duration-150 text-xs w-5 h-5 flex items-center justify-center rounded hover:bg-[#ff4444]/10"
                          aria-label={`Delete ${inv.name}`}
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Bottom row: invested → current + pct */}
                    <div className="flex items-center gap-3 pl-[18px]">
                      <span className="text-xs text-[#555]">
                        <span className="text-[#888]">${fmt(inv.invested)}</span> invested
                      </span>
                      <span className="text-[#333]">→</span>
                      <span className="text-xs text-[#555]">
                        <span className="text-[#888]">${fmt(inv.current)}</span> now
                      </span>
                      <span className="text-[#333]">·</span>
                      <span
                        className="text-xs font-semibold tabular-nums"
                        style={{ color: gain ? "#50e3c2" : "#ff4444" }}
                      >
                        {fmtPct(pnlPct)}
                      </span>
                      {totalCurrent > 0 && (
                        <>
                          <span className="text-[#333]">·</span>
                          <span className="text-xs text-[#555]">{pctOfPortfolio.toFixed(1)}% of portfolio</span>
                        </>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="h-[3px] bg-[#1a1a1a] rounded-full overflow-hidden ml-[18px] mt-2.5">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${Math.min(pctOfPortfolio, 100)}%`, backgroundColor: color }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {investments.length === 0 && (
          <div className="card p-8 text-center hover:border-[#444]">
            <p className="text-[#555] text-sm">No investments yet.</p>
          </div>
        )}
      </div>
    </main>
  );
}
