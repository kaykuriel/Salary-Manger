"use client";

interface SummaryCardsProps {
  salary: number;
  spent: number;
}

function fmt(v: number) {
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SummaryCards({ salary, spent }: SummaryCardsProps) {
  const remaining = salary - spent;
  const spentPct = salary > 0 ? Math.min((spent / salary) * 100, 100) : 0;
  const remainingPct = salary > 0 ? Math.max(((salary - spent) / salary) * 100, 0) : 0;
  const isOver = remaining < 0;

  const barColor = spentPct >= 100 ? "#ff4444" : spentPct >= 80 ? "#f5a623" : "#0070f3";

  return (
    <div className="flex flex-col gap-3">

      {/* Remaining — hero */}
      <div className={`card p-6 ${isOver ? "border-[#ff4444]/30 bg-[#ff4444]/[0.04] hover:border-[#ff4444]/50" : "hover:border-[#444]"}`}>
        <p className="text-xs font-mono uppercase tracking-widest text-[#666] mb-1.5">
          {isOver ? "Over budget by" : "Remaining"}
        </p>
        <p className={`text-5xl font-semibold tabular-nums tracking-tight leading-none ${isOver ? "text-[#ff4444]" : "text-white"}`}>
          {isOver ? "-" : ""}${fmt(isOver ? Math.abs(remaining) : remaining)}
        </p>
        {salary > 0 && (
          <p className="text-sm text-[#555] mt-2">
            {isOver
              ? `${(spentPct - 100).toFixed(1)}% above your income`
              : `${remainingPct.toFixed(1)}% of $${fmt(salary)} available`}
          </p>
        )}
      </div>

      {/* Spent + Income */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-5 hover:border-[#444]">
          <p className="text-xs font-mono uppercase tracking-widest text-[#666] mb-1.5">Total Spent</p>
          <p className="text-2xl font-semibold tabular-nums text-white">${fmt(spent)}</p>
          {salary > 0 && (
            <p className="text-xs text-[#555] mt-1">{spentPct.toFixed(1)}% of income</p>
          )}
        </div>
        <div className="card p-5 hover:border-[#444]">
          <p className="text-xs font-mono uppercase tracking-widest text-[#666] mb-1.5">Income</p>
          <p className="text-2xl font-semibold tabular-nums text-white">${fmt(salary)}</p>
          {salary > 0 && spent > 0 && (
            <p className="text-xs text-[#555] mt-1">${fmt(remaining)} left</p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {salary > 0 && (
        <div className="card p-5 hover:border-[#444]">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-mono uppercase tracking-widest text-[#666]">Budget used</p>
            <p
              className="text-sm font-semibold tabular-nums transition-colors duration-300"
              style={{ color: barColor }}
            >
              {spentPct.toFixed(2)}%
            </p>
          </div>
          <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${spentPct}%`, backgroundColor: barColor }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-[#555]">${fmt(spent)} spent</span>
            <span className="text-xs text-[#555]">${fmt(salary)} total</span>
          </div>
        </div>
      )}
    </div>
  );
}
