"use client";

import { useState, useEffect } from "react";

type Category = { id: string; name: string; amount: number; color: string };
type Extra = { id: string; name: string; amount: number };
type MonthReport = {
  monthKey: string;
  salary: number;
  categories: Category[];
  extras: Extra[];
  updatedAt: string;
};

function fmt(v: number) {
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtShort(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}k`;
  return `$${fmt(v)}`;
}

function formatMonthLabel(mk: string) {
  const [y, m] = mk.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

// ─── SVG Bar Chart ─────────────────────────────────────────────────────────────

interface BarData {
  label: string;
  value: number;
  value2?: number;
}

function BarChart({
  data,
  height = 160,
  color1 = "#cc0000",
  color2 = "#50e3c2",
  label1 = "Income",
  label2 = "Spent",
  showLegend = false,
}: {
  data: BarData[];
  height?: number;
  color1?: string;
  color2?: string;
  label1?: string;
  label2?: string;
  showLegend?: boolean;
}) {
  if (data.length === 0) return null;

  const maxVal = Math.max(...data.flatMap((d) => [d.value, d.value2 ?? 0]));
  if (maxVal === 0) return null;

  const paddingTop = 16;
  const paddingBottom = 28;
  const paddingLeft = 40;
  const paddingRight = 8;
  const chartW = Math.max(data.length * 40, 280);
  const svgH = height;
  const chartH = svgH - paddingTop - paddingBottom;
  const grouped = data[0].value2 !== undefined;
  const barSlot = (chartW - paddingLeft - paddingRight) / data.length;
  const barGap = grouped ? barSlot * 0.12 : barSlot * 0.18;
  const barW = grouped
    ? (barSlot - barGap * 3) / 2
    : barSlot - barGap * 2;

  // Gridlines
  const gridCount = 4;
  const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => i / gridCount);

  return (
    <div className="overflow-x-auto">
      <svg
        width={chartW}
        height={svgH}
        className="min-w-full"
        style={{ display: "block" }}
      >
        {/* Gridlines */}
        {gridLines.map((pct, i) => {
          const y = paddingTop + chartH * (1 - pct);
          const val = maxVal * pct;
          return (
            <g key={i}>
              <line
                x1={paddingLeft}
                x2={chartW - paddingRight}
                y1={y}
                y2={y}
                stroke="#1a1a1a"
                strokeWidth={1}
              />
              {i > 0 && (
                <text
                  x={paddingLeft - 4}
                  y={y + 4}
                  textAnchor="end"
                  fill="#444"
                  fontSize={9}
                  fontFamily="monospace"
                >
                  {fmtShort(val)}
                </text>
              )}
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const x = paddingLeft + i * barSlot;
          const h1 = maxVal > 0 ? (d.value / maxVal) * chartH : 0;
          const h2 = d.value2 !== undefined && maxVal > 0 ? (d.value2 / maxVal) * chartH : 0;

          const x1 = grouped ? x + barGap : x + barGap;
          const x2 = x1 + barW + barGap;

          return (
            <g key={i}>
              {/* Bar 1 */}
              <rect
                x={x1}
                y={paddingTop + chartH - h1}
                width={barW}
                height={Math.max(h1, 0)}
                fill={color1}
                rx={2}
              />
              {/* Bar 2 */}
              {grouped && d.value2 !== undefined && (
                <rect
                  x={x2}
                  y={paddingTop + chartH - h2}
                  width={barW}
                  height={Math.max(h2, 0)}
                  fill={color2}
                  rx={2}
                  opacity={0.8}
                />
              )}
              {/* Label */}
              <text
                x={grouped ? x1 + barW + barGap / 2 : x + barSlot / 2}
                y={svgH - 6}
                textAnchor="middle"
                fill="#555"
                fontSize={9}
                fontFamily="monospace"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      {showLegend && grouped && (
        <div className="flex gap-4 mt-2 px-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color1 }} />
            <span className="text-xs text-[#666]">{label1}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color2 }} />
            <span className="text-xs text-[#666]">{label2}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Excel Export ──────────────────────────────────────────────────────────────

async function exportExcel(months: MonthReport[]) {
  const XLSX = await import("xlsx");

  // Sheet 1: Summary
  const summaryRows = [
    ["Month", "Salary", "Extra Income", "Total Income", "Spent", "Remaining", "Savings %"],
    ...months.map((m) => {
      const extras = m.extras.reduce((s, e) => s + e.amount, 0);
      const income = m.salary + extras;
      const spent = m.categories.reduce((s, c) => s + c.amount, 0);
      const remaining = income - spent;
      const savingsPct = income > 0 ? ((remaining / income) * 100).toFixed(1) + "%" : "—";
      return [m.monthKey, m.salary, extras, income, spent, remaining, savingsPct];
    }),
  ];

  // Sheet 2: Expenses
  const expenseRows = [
    ["Month", "Category", "Amount", "% of Income"],
    ...months.flatMap((m) => {
      const extras = m.extras.reduce((s, e) => s + e.amount, 0);
      const income = m.salary + extras;
      return m.categories.map((c) => [
        m.monthKey,
        c.name,
        c.amount,
        income > 0 ? ((c.amount / income) * 100).toFixed(1) + "%" : "—",
      ]);
    }),
  ];

  // Sheet 3: Extras
  const extrasRows = [
    ["Month", "Source", "Amount"],
    ...months.flatMap((m) =>
      m.extras.map((e) => [m.monthKey, e.name, e.amount])
    ),
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), "Summary");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(expenseRows), "Expenses");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(extrasRows), "Extras");

  XLSX.writeFile(wb, "salary-report.xlsx");
}

// ─── Reports Manager ───────────────────────────────────────────────────────────

export default function ReportsManager() {
  const [months, setMonths] = useState<MonthReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  function loadReports() {
    setLoading(true);
    setError("");
    fetch("/api/reports")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { setMonths(d.months ?? []); setLoading(false); })
      .catch(() => { setError("Failed to load reports."); setLoading(false); });
  }

  useEffect(() => {
    loadReports();
    function onVisible() {
      if (document.visibilityState === "visible") loadReports();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function deleteMonth(monthKey: string) {
    setDeleting(monthKey);
    await fetch(`/api/data/${monthKey}`, { method: "DELETE" }).catch(() => {});
    setMonths((prev) => prev.filter((m) => m.monthKey !== monthKey));
    setConfirmDelete(null);
    setDeleting(null);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <span className="text-[#555] text-sm">Loading…</span>
      </main>
    );
  }

  if (error) {
    return (
      <main className="py-8 px-4 text-center">
        <p className="text-[#ff4444] text-sm">{error}</p>
      </main>
    );
  }

  // ── Compute all-time stats ──
  const totalMonths = months.length;
  const allTimeIncome = months.reduce((s, m) => {
    return s + m.salary + m.extras.reduce((e, x) => e + x.amount, 0);
  }, 0);
  const allTimeSpent = months.reduce((s, m) => {
    return s + m.categories.reduce((e, c) => e + c.amount, 0);
  }, 0);
  const allTimeSavings = allTimeIncome - allTimeSpent;
  const avgSavingsRate = allTimeIncome > 0
    ? ((allTimeSavings / allTimeIncome) * 100).toFixed(1)
    : "—";

  // ── Last 12 months bar chart ──
  const last12 = months.slice(-12);
  const trendData: BarData[] = last12.map((m) => {
    const income = m.salary + m.extras.reduce((s, e) => s + e.amount, 0);
    const spent = m.categories.reduce((s, c) => s + c.amount, 0);
    return { label: formatMonthLabel(m.monthKey), value: income, value2: spent };
  });

  // ── Top 8 category totals ──
  const catTotals: Record<string, number> = {};
  for (const m of months) {
    for (const c of m.categories) {
      catTotals[c.name] = (catTotals[c.name] ?? 0) + c.amount;
    }
  }
  const topCats = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const catChartData: BarData[] = topCats.map(([name, amt]) => ({
    label: name.length > 8 ? name.slice(0, 7) + "…" : name,
    value: amt,
  }));

  return (
    <main className="py-8 px-4 print:py-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between print:hidden">
          <h1 className="text-base font-semibold text-white tracking-tight">Reports</h1>
          <div className="flex gap-2">
            {months.length > 0 && (
              <button
                onClick={() => exportExcel(months)}
                className="btn text-xs px-3 py-1.5"
                title="Export to Excel"
              >
                ↓ Excel
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="btn-ghost border border-[#333] text-xs px-3 py-1.5"
              title="Print / Save as PDF"
            >
              ⎙ Print
            </button>
          </div>
        </div>

        {/* Print header */}
        <div className="hidden print:block">
          <h1 className="text-xl font-semibold text-white">Salary Report</h1>
          <p className="text-xs text-[#666] mt-1">Generated {new Date().toLocaleDateString()}</p>
        </div>

        {months.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-[#555] text-sm">No data recorded yet.</p>
            <p className="text-[#444] text-xs mt-1">Add salary data in the Dashboard to see reports.</p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Months", value: String(totalMonths), sub: "with data" },
                { label: "Income", value: fmtShort(allTimeIncome), sub: "all time" },
                { label: "Spent", value: fmtShort(allTimeSpent), sub: "all time" },
                { label: "Savings", value: `${avgSavingsRate}%`, sub: "avg rate" },
              ].map((s) => (
                <div key={s.label} className="card p-4 hover:border-[#444]">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#555] mb-1">{s.label}</p>
                  <p className="text-xl font-semibold text-white tabular-nums">{s.value}</p>
                  <p className="text-[10px] text-[#444] mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Monthly trend chart */}
            {trendData.length > 0 && (
              <div className="card p-5 hover:border-[#444]">
                <p className="text-xs font-mono uppercase tracking-widest text-[#555] mb-4">
                  Monthly Trend (last {last12.length} months)
                </p>
                <BarChart
                  data={trendData}
                  height={160}
                  color1="#cc0000"
                  color2="#50e3c2"
                  label1="Income"
                  label2="Spent"
                  showLegend
                />
              </div>
            )}

            {/* Category totals chart */}
            {catChartData.length > 0 && (
              <div className="card p-5 hover:border-[#444]">
                <p className="text-xs font-mono uppercase tracking-widest text-[#555] mb-4">
                  Top Categories (all time)
                </p>
                <BarChart data={catChartData} height={140} color1="#ff4444" />
                <ul className="mt-4 flex flex-col">
                  {topCats.map(([name, amt], i) => (
                    <li key={name} className={`flex items-center justify-between py-2 ${i > 0 ? "border-t border-[#1a1a1a]" : ""}`}>
                      <span className="text-sm text-white">{name}</span>
                      <span className="text-sm font-semibold tabular-nums text-white">${fmt(amt)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Month-by-month table */}
            <div className="card overflow-hidden hover:border-[#444]">
              <div className="px-5 py-3 border-b border-[#222]">
                <p className="text-xs font-mono uppercase tracking-widest text-[#555]">Month by Month</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[#555] border-b border-[#1a1a1a]">
                      <th className="text-left px-5 py-2.5 font-mono tracking-widest font-normal">MONTH</th>
                      <th className="text-right px-3 py-2.5 font-mono tracking-widest font-normal">INCOME</th>
                      <th className="text-right px-3 py-2.5 font-mono tracking-widest font-normal">SPENT</th>
                      <th className="text-right px-3 py-2.5 font-mono tracking-widest font-normal">REMAINING</th>
                      <th className="text-right px-3 py-2.5 font-mono tracking-widest font-normal hidden sm:table-cell">ITEMS</th>
                      <th className="w-8 print:hidden" />
                    </tr>
                  </thead>
                  <tbody>
                    {[...months].reverse().map((m) => {
                      const income = m.salary + m.extras.reduce((s, e) => s + e.amount, 0);
                      const spent = m.categories.reduce((s, c) => s + c.amount, 0);
                      const remaining = income - spent;
                      const savingsPct = income > 0 ? ((remaining / income) * 100).toFixed(1) : null;
                      const isConfirming = confirmDelete === m.monthKey;
                      const isDeleting = deleting === m.monthKey;
                      return (
                        <tr key={m.monthKey} className="border-b border-[#141414] hover:bg-white/[0.02] transition-colors group">
                          <td className="px-5 py-2.5 text-white font-mono">{m.monthKey}</td>
                          <td className="px-3 py-2.5 text-right text-white tabular-nums">${fmt(income)}</td>
                          <td className="px-3 py-2.5 text-right text-[#888] tabular-nums">${fmt(spent)}</td>
                          <td className={`px-3 py-2.5 text-right tabular-nums ${remaining < 0 ? "text-[#ff4444]" : "text-[#50e3c2]"}`}>
                            {remaining < 0 ? "-" : "+"}${fmt(Math.abs(remaining))}
                            {savingsPct !== null && (
                              <span className="text-[#555] ml-1">({savingsPct}%)</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right text-[#555] hidden sm:table-cell">
                            {m.categories.length}
                          </td>
                          <td className="pr-3 py-2.5 text-right print:hidden">
                            {isConfirming ? (
                              <div className="flex items-center gap-1 justify-end">
                                <button
                                  onClick={() => setConfirmDelete(null)}
                                  className="text-[10px] text-[#555] hover:text-white px-1.5 py-0.5 rounded transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => deleteMonth(m.monthKey)}
                                  disabled={isDeleting}
                                  className="text-[10px] px-1.5 py-0.5 bg-[#ff4444] hover:bg-red-600 text-white rounded transition-colors disabled:opacity-50"
                                >
                                  {isDeleting ? "…" : "Delete"}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDelete(m.monthKey)}
                                className="opacity-0 group-hover:opacity-100 text-[#444] hover:text-[#ff4444] transition-all duration-150 text-xs w-5 h-5 flex items-center justify-center rounded hover:bg-[#ff4444]/10 ml-auto"
                                aria-label={`Delete ${m.monthKey}`}
                              >
                                ✕
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-[#333]">
                      <td className="px-5 py-2.5 text-xs font-mono uppercase tracking-widest text-[#555]">Total</td>
                      <td className="px-3 py-2.5 text-right text-white tabular-nums font-semibold">${fmt(allTimeIncome)}</td>
                      <td className="px-3 py-2.5 text-right text-[#888] tabular-nums font-semibold">${fmt(allTimeSpent)}</td>
                      <td className={`px-3 py-2.5 text-right tabular-nums font-semibold ${allTimeSavings < 0 ? "text-[#ff4444]" : "text-[#50e3c2]"}`}>
                        {allTimeSavings < 0 ? "-" : "+"}${fmt(Math.abs(allTimeSavings))}
                      </td>
                      <td className="hidden sm:table-cell" />
                      <td className="print:hidden" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
