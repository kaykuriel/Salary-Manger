"use client";

interface Category { id: string; name: string; amount: number; color: string; }

interface ExpenseChartProps {
  categories: Category[];
  salary: number;
}

function fmt(value: number) {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtShort(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)     return `$${(value / 1_000).toFixed(1)}k`;
  return `$${fmt(value)}`;
}

interface Segment {
  color: string;
  isRemaining: boolean;
  path: string;
}

function buildDonut(
  data: { value: number; color: string; isRemaining: boolean }[],
  cx: number, cy: number,
  outerR: number, innerR: number,
  gapDeg: number,
): Segment[] {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return [];

  const gapRad = (gapDeg * Math.PI) / 180;
  const segments: Segment[] = [];
  let angle = -Math.PI / 2;

  data.forEach((entry) => {
    const sweep    = (entry.value / total) * 2 * Math.PI;
    const draw     = Math.max(sweep - gapRad, 0.001);
    const sa = angle, ea = angle + draw;

    const x1o = cx + outerR * Math.cos(sa), y1o = cy + outerR * Math.sin(sa);
    const x2o = cx + outerR * Math.cos(ea), y2o = cy + outerR * Math.sin(ea);
    const x2i = cx + innerR * Math.cos(ea), y2i = cy + innerR * Math.sin(ea);
    const x1i = cx + innerR * Math.cos(sa), y1i = cy + innerR * Math.sin(sa);
    const large = draw > Math.PI ? 1 : 0;

    const path = [
      `M ${x1o.toFixed(3)} ${y1o.toFixed(3)}`,
      `A ${outerR} ${outerR} 0 ${large} 1 ${x2o.toFixed(3)} ${y2o.toFixed(3)}`,
      `L ${x2i.toFixed(3)} ${y2i.toFixed(3)}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${x1i.toFixed(3)} ${y1i.toFixed(3)}`,
      "Z",
    ].join(" ");

    segments.push({ color: entry.color, isRemaining: entry.isRemaining, path });
    angle += sweep;
  });

  return segments;
}

export default function ExpenseChart({ categories, salary }: ExpenseChartProps) {
  const validCats = categories.filter((c) => c.amount > 0 && isFinite(c.amount));
  if (validCats.length === 0) return null;

  const spent     = validCats.reduce((sum, c) => sum + c.amount, 0);
  const remaining = salary - spent;
  const hasIncome = salary > 0;
  const spentPct  = hasIncome ? Math.min((spent / salary) * 100, 100) : 100;

  const chartData = [
    ...validCats.map((c) => ({ value: c.amount, color: c.color, isRemaining: false })),
    ...(hasIncome && remaining > 0
      ? [{ value: remaining, color: "#2e2e2e", isRemaining: true }]
      : []),
  ];

  const segments = buildDonut(chartData, 100, 100, 95, 63, 3);

  return (
    <div className="bg-[#111] border border-[#222] rounded-xl p-5">
      <p className="text-xs font-mono uppercase tracking-widest text-[#444] mb-4">
        Breakdown
      </p>

      <div className="relative">
        <svg viewBox="0 0 200 200" className="w-full" style={{ maxHeight: 220 }}>
          {segments.map((seg, i) => (
            <path
              key={i}
              d={seg.path}
              fill={seg.color}
              stroke={seg.isRemaining ? "#444" : "transparent"}
              strokeWidth={seg.isRemaining ? 0.5 : 0}
            />
          ))}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[9px] font-mono uppercase tracking-widest text-[#444] mb-0.5">spent</span>
          <span className="text-xl font-semibold text-white tabular-nums leading-none">{fmtShort(spent)}</span>
          {hasIncome && (
            <span className="text-[11px] text-[#555] mt-1 tabular-nums">{spentPct.toFixed(1)}%</span>
          )}
        </div>
      </div>

      <ul className="mt-3 flex flex-col">
        {validCats.map((cat) => {
          const pctOfSpent  = spent > 0 ? (cat.amount / spent)  * 100 : 0;
          const pctOfIncome = hasIncome  ? (cat.amount / salary) * 100 : 0;
          return (
            <li key={cat.id} className="flex items-center gap-2 py-2.5 border-t border-[#1c1c1c] first:border-t-0">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="flex-1 text-sm text-[#ccc] truncate min-w-0">{cat.name}</span>
              <div className="flex items-center gap-2 flex-shrink-0 text-xs tabular-nums">
                {hasIncome && <span className="text-[#555] hidden sm:block">{pctOfIncome.toFixed(1)}%</span>}
                <span className="text-[#666] w-10 text-right">{pctOfSpent.toFixed(0)}%</span>
              </div>
              <span className="text-sm font-semibold text-white tabular-nums whitespace-nowrap flex-shrink-0 text-right min-w-[72px]">
                ${fmt(cat.amount)}
              </span>
            </li>
          );
        })}

        {hasIncome && remaining > 0 && (
          <li className="flex items-center gap-2 py-2.5 border-t border-[#1c1c1c]">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-[#555] bg-[#2e2e2e]" />
            <span className="flex-1 text-sm text-[#777]">Remaining</span>
            <div className="flex items-center gap-2 flex-shrink-0 text-xs tabular-nums">
              <span className="text-[#555] w-10 text-right">{(100 - spentPct).toFixed(0)}%</span>
            </div>
            <span className="text-sm font-semibold text-[#888] tabular-nums whitespace-nowrap flex-shrink-0 text-right min-w-[72px]">
              ${fmt(remaining)}
            </span>
          </li>
        )}

        {hasIncome && remaining < 0 && (
          <li className="flex items-center gap-2 py-2.5 border-t border-[#1c1c1c]">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-[#ff4444]/50" />
            <span className="flex-1 text-sm text-[#ff4444]/80">Over budget</span>
            <span className="text-sm font-semibold text-[#ff4444] tabular-nums whitespace-nowrap flex-shrink-0 text-right min-w-[72px]">
              -${fmt(Math.abs(remaining))}
            </span>
          </li>
        )}
      </ul>
    </div>
  );
}
