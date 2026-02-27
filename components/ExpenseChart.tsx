"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface Category { id: string; name: string; amount: number; color: string; }

interface ExpenseChartProps {
  categories: Category[];
  salary: number;
}

function fmt(value: number) {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: { color: string; isRemaining?: boolean };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2.5 text-xs shadow-2xl">
      <p className="text-[#aaa] font-medium mb-1">{item.name}</p>
      <p
        className="font-semibold tabular-nums text-sm"
        style={{ color: item.payload.isRemaining ? "#555" : item.payload.color }}
      >
        ${fmt(item.value)}
      </p>
    </div>
  );
}

export default function ExpenseChart({ categories, salary }: ExpenseChartProps) {
  if (categories.length === 0) return null;

  const spent = categories.reduce((sum, c) => sum + c.amount, 0);
  const remaining = salary - spent;
  const hasIncome = salary > 0;
  const spentPct = hasIncome ? Math.min((spent / salary) * 100, 100) : 100;

  const data = [
    ...categories.map((c) => ({
      name: c.name,
      value: c.amount,
      color: c.color,
      isRemaining: false,
    })),
    ...(hasIncome && remaining > 0
      ? [{ name: "Remaining", value: remaining, color: "#2e2e2e", isRemaining: true }]
      : []),
  ];

  return (
    <div className="bg-[#111] border border-[#222] rounded-xl p-5">
      <p className="text-xs font-mono uppercase tracking-widest text-[#444] mb-4">
        Breakdown
      </p>

      {/* Donut + center label */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={72}
              outerRadius={104}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke={entry.isRemaining ? "#2d2d2d" : "transparent"}
                  strokeWidth={entry.isRemaining ? 1 : 0}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#444] mb-0.5">
            spent
          </span>
          <span className="text-2xl font-semibold text-white tabular-nums leading-none">
            ${fmt(spent)}
          </span>
          {hasIncome && (
            <span className="text-xs text-[#555] mt-1 tabular-nums">
              {spentPct.toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      {/* Custom legend */}
      <ul className="mt-4 flex flex-col">
        {categories.map((cat) => {
          const pctOfSpent = spent > 0 ? (cat.amount / spent) * 100 : 0;
          const pctOfIncome = hasIncome ? (cat.amount / salary) * 100 : 0;
          return (
            <li
              key={cat.id}
              className="flex items-center gap-3 py-2.5 border-t border-[#1c1c1c] first:border-t-0"
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="flex-1 text-sm text-[#ccc] truncate">{cat.name}</span>
              <div className="flex items-center gap-3 flex-shrink-0">
                {hasIncome && (
                  <span className="text-xs text-[#555] tabular-nums hidden sm:block">
                    {pctOfIncome.toFixed(1)}% income
                  </span>
                )}
                <span className="text-xs text-[#666] tabular-nums">
                  {pctOfSpent.toFixed(1)}%
                </span>
                <span className="text-sm font-semibold text-white tabular-nums w-24 text-right">
                  ${fmt(cat.amount)}
                </span>
              </div>
            </li>
          );
        })}

        {hasIncome && remaining > 0 && (
          <li className="flex items-center gap-3 py-2.5 border-t border-[#1c1c1c]">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-[#555] bg-[#2e2e2e]" />
            <span className="flex-1 text-sm text-[#777]">Remaining</span>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-xs text-[#666] tabular-nums">
                {(100 - spentPct).toFixed(1)}%
              </span>
              <span className="text-sm font-semibold text-[#888] tabular-nums w-24 text-right">
                ${fmt(remaining)}
              </span>
            </div>
          </li>
        )}

        {hasIncome && remaining < 0 && (
          <li className="flex items-center gap-3 py-2.5 border-t border-[#1c1c1c]">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-[#ff4444]/40" />
            <span className="flex-1 text-sm text-[#ff4444]/70">Over budget</span>
            <span className="text-sm font-semibold text-[#ff4444] tabular-nums w-24 text-right">
              -${fmt(Math.abs(remaining))}
            </span>
          </li>
        )}
      </ul>
    </div>
  );
}
