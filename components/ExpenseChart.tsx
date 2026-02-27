"use client";

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

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
  payload: { color: string };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-app-surface border border-app-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-app-text font-medium mb-0.5">{item.name}</p>
      <p style={{ color: item.payload.color }} className="font-semibold tabular-nums">
        ${fmt(item.value)}
      </p>
    </div>
  );
}

export default function ExpenseChart({ categories, salary }: ExpenseChartProps) {
  if (categories.length === 0) return null;

  const spent = categories.reduce((sum, c) => sum + c.amount, 0);
  const remaining = salary - spent;

  const data = [
    ...categories.map((c) => ({ name: c.name, value: c.amount, color: c.color })),
    ...(salary > 0 && remaining > 0
      ? [{ name: "Remaining", value: remaining, color: "#1a1a1a" }]
      : []),
  ];

  return (
    <div className="bg-app-surface border border-app-border rounded-xl p-5">
      <p className="text-xs font-mono uppercase tracking-widest text-app-muted mb-4">
        Breakdown
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={68}
            outerRadius={108}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span style={{ color: "#888", fontSize: "11px" }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
