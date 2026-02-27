"use client";

import { useState, useMemo } from "react";

// IR regressivo (Brasil - renda fixa)
function irRate(months: number): number {
  const days = months * 30;
  if (days <= 180) return 0.225;
  if (days <= 360) return 0.20;
  if (days <= 720) return 0.175;
  return 0.15;
}

function irLabel(months: number): string {
  const days = months * 30;
  if (days <= 180) return "22.5%";
  if (days <= 360) return "20%";
  if (days <= 720) return "17.5%";
  return "15%";
}

function calcCDI(principal: number, cdiAnual: number, pctCdi: number, months: number) {
  if (principal <= 0 || months <= 0) return null;
  const effectiveAnual = (cdiAnual / 100) * (pctCdi / 100);
  const fator          = Math.pow(1 + effectiveAnual, months / 12);
  const bruto          = principal * (fator - 1);
  const ir             = bruto * irRate(months);
  const liquido        = bruto - ir;
  return { bruto, ir, liquido, final: principal + liquido, irPct: irRate(months) };
}

function fmt(v: number) {
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function useMoney(initial = "") {
  const [raw, setRaw]         = useState(initial);
  const [focused, setFocused] = useState(false);

  const display = focused
    ? raw
    : raw && !isNaN(parseFloat(raw.replace(/,/g, "")))
    ? parseFloat(raw.replace(/,/g, "")).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : raw;

  return {
    raw,
    display,
    value: parseFloat(raw.replace(/,/g, "")) || 0,
    bind: {
      value: display,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setRaw(e.target.value),
      onFocus:  () => setFocused(true),
      onBlur:   () => setFocused(false),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
      },
    },
    reset: () => setRaw(""),
  };
}

const COMPARE_PERIODS = [3, 6, 12, 24, 36, 60];

export default function InvestmentsManager() {
  const principal    = useMoney();
  const [cdi,    setCdi]    = useState("10.50");
  const [pctCdi, setPctCdi] = useState("100");
  const [months, setMonths] = useState("12");

  const cdiNum    = parseFloat(cdi)    || 0;
  const pctCdiNum = parseFloat(pctCdi) || 0;
  const monthsNum = parseInt(months)   || 0;

  const result = useMemo(
    () => calcCDI(principal.value, cdiNum, pctCdiNum, monthsNum),
    [principal.value, cdiNum, pctCdiNum, monthsNum]
  );

  const effectiveAnual = (cdiNum * pctCdiNum) / 100;

  return (
    <main className="py-8 px-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-center py-1">
          <span className="text-base font-semibold text-white tracking-tight select-none">
            CDI Yield Calculator
          </span>
        </div>

        {/* Inputs */}
        <div className="card p-5 hover:border-[#444]">
          <p className="text-xs font-mono uppercase tracking-widest text-[#666] mb-4">
            Simulation
          </p>

          <div className="flex flex-col gap-4">
            {/* Principal */}
            <div>
              <label className="block text-xs text-[#555] mb-1.5">Initial amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] text-sm select-none pointer-events-none">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="10,000.00"
                  className="field !pl-7 text-lg font-semibold"
                  {...principal.bind}
                />
              </div>
            </div>

            {/* CDI + % CDI side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#555] mb-1.5">CDI rate (% p.a.)</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={cdi}
                    onChange={(e) => setCdi(e.target.value)}
                    placeholder="10.50"
                    className="field pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] text-sm select-none pointer-events-none">%</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#555] mb-1.5">% of CDI</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={pctCdi}
                    onChange={(e) => setPctCdi(e.target.value)}
                    placeholder="100"
                    className="field pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] text-sm select-none pointer-events-none">%</span>
                </div>
              </div>
            </div>

            {/* Period */}
            <div>
              <label className="block text-xs text-[#555] mb-1.5">Period (months)</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={months}
                  onChange={(e) => setMonths(e.target.value)}
                  placeholder="12"
                  className="field pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] text-sm select-none pointer-events-none">months</span>
              </div>
              {/* Quick period buttons */}
              <div className="flex gap-1.5 mt-2">
                {[3, 6, 12, 24, 36, 60].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMonths(String(m))}
                    className={`flex-1 py-1 text-xs rounded border transition-all duration-150
                      ${monthsNum === m
                        ? "border-[#0070f3]/60 text-[#0070f3] bg-[#0070f3]/10"
                        : "border-[#222] text-[#555] hover:text-[#888] hover:border-[#333]"
                      }`}
                  >
                    {m >= 12 ? `${m / 12}y` : `${m}m`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Result */}
        {result && principal.value > 0 ? (
          <>
            {/* Hero: net yield */}
            <div className="card p-6 border-[#50e3c2]/20 bg-[#50e3c2]/[0.03] hover:border-[#50e3c2]/30">
              <p className="text-xs font-mono uppercase tracking-widest text-[#50e3c2]/60 mb-1.5">
                Net yield ({monthsNum} {monthsNum === 1 ? "month" : "months"})
              </p>
              <p className="text-5xl font-semibold tabular-nums tracking-tight text-[#50e3c2] leading-none">
                +${fmt(result.liquido)}
              </p>
              <p className="text-sm text-[#50e3c2]/50 mt-2">
                {effectiveAnual.toFixed(2)}% p.a. effective · IR {irLabel(monthsNum)}
              </p>
            </div>

            {/* Detail grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="card p-5 hover:border-[#444]">
                <p className="text-xs font-mono uppercase tracking-widest text-[#666] mb-1.5">Final amount</p>
                <p className="text-2xl font-semibold tabular-nums text-white">${fmt(result.final)}</p>
                <p className="text-xs text-[#555] mt-1">principal + net</p>
              </div>
              <div className="card p-5 hover:border-[#444]">
                <p className="text-xs font-mono uppercase tracking-widest text-[#666] mb-1.5">Gross yield</p>
                <p className="text-2xl font-semibold tabular-nums text-white">${fmt(result.bruto)}</p>
                <p className="text-xs text-[#555] mt-1">before tax</p>
              </div>
              <div className="card p-5 hover:border-[#444]">
                <p className="text-xs font-mono uppercase tracking-widest text-[#666] mb-1.5">IR ({irLabel(monthsNum)})</p>
                <p className="text-2xl font-semibold tabular-nums text-[#ff4444]">-${fmt(result.ir)}</p>
                <p className="text-xs text-[#555] mt-1">income tax</p>
              </div>
              <div className="card p-5 hover:border-[#444]">
                <p className="text-xs font-mono uppercase tracking-widest text-[#666] mb-1.5">Invested</p>
                <p className="text-2xl font-semibold tabular-nums text-white">${fmt(principal.value)}</p>
                <p className="text-xs text-[#555] mt-1">initial capital</p>
              </div>
            </div>

            {/* Comparison table */}
            <div className="card overflow-hidden hover:border-[#444]">
              <div className="px-5 py-3 border-b border-[#222]">
                <p className="text-xs font-mono uppercase tracking-widest text-[#666]">
                  Projection comparison · {pctCdiNum}% of CDI ({cdiNum}% p.a.)
                </p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1a1a1a]">
                    <th className="px-5 py-2.5 text-left text-xs font-mono text-[#555] font-normal">Period</th>
                    <th className="px-5 py-2.5 text-right text-xs font-mono text-[#555] font-normal">Gross</th>
                    <th className="px-5 py-2.5 text-right text-xs font-mono text-[#555] font-normal">IR</th>
                    <th className="px-5 py-2.5 text-right text-xs font-mono text-[#555] font-normal">Net</th>
                    <th className="px-5 py-2.5 text-right text-xs font-mono text-[#555] font-normal">Final</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_PERIODS.map((m, i) => {
                    const r = calcCDI(principal.value, cdiNum, pctCdiNum, m);
                    if (!r) return null;
                    const isActive = m === monthsNum;
                    return (
                      <tr
                        key={m}
                        onClick={() => setMonths(String(m))}
                        className={`border-t border-[#1a1a1a] cursor-pointer transition-colors duration-150
                          ${isActive ? "bg-[#0070f3]/[0.06]" : "hover:bg-white/[0.02]"}
                          ${i === 0 ? "border-t-0" : ""}
                        `}
                      >
                        <td className="px-5 py-3 text-sm">
                          <span className={isActive ? "text-[#0070f3] font-semibold" : "text-[#888]"}>
                            {m >= 12 ? `${m / 12}y` : `${m}m`}
                          </span>
                          {isActive && (
                            <span className="ml-1.5 text-[10px] text-[#0070f3]/60">◀</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-sm text-right text-[#888] tabular-nums whitespace-nowrap">
                          ${fmt(r.bruto)}
                        </td>
                        <td className="px-5 py-3 text-sm text-right text-[#ff4444]/70 tabular-nums whitespace-nowrap">
                          -{irLabel(m)}
                        </td>
                        <td className="px-5 py-3 text-sm text-right text-[#50e3c2] font-semibold tabular-nums whitespace-nowrap">
                          +${fmt(r.liquido)}
                        </td>
                        <td className="px-5 py-3 text-sm text-right text-white tabular-nums whitespace-nowrap">
                          ${fmt(r.final)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="card p-8 text-center hover:border-[#444]">
            <p className="text-[#555] text-sm">Enter an amount to see the projection.</p>
          </div>
        )}
      </div>
    </main>
  );
}
