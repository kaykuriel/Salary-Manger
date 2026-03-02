"use client";

interface Category { id: string; name: string; amount: number; color: string; }

interface CategoryListProps {
  categories: Category[];
  salary: number;
  onDelete: (id: string) => void;
}

function fmt(v: number) {
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CategoryList({ categories, salary, onDelete }: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <div className="card p-8 text-center hover:border-[#444]">
        <p className="text-[#555] text-sm">No expenses yet.</p>
      </div>
    );
  }

  const totalSpent = categories.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="card overflow-hidden hover:border-[#444]">
      {/* Header */}
      <div className="px-5 py-3 border-b border-[#222] flex justify-between items-center">
        <p className="text-xs font-mono uppercase tracking-widest text-[#666]">Expenses</p>
        <p className="text-xs text-[#555]">
          {categories.length} {categories.length === 1 ? "item" : "items"}
        </p>
      </div>

      {/* Rows */}
      <ul>
        {categories.map((cat, i) => {
          const pctOfSalary   = salary > 0    ? (cat.amount / salary)     * 100 : 0;
          const pctOfSpending = totalSpent > 0 ? (cat.amount / totalSpent) * 100 : 0;
          const barWidth = salary > 0 ? Math.min(pctOfSalary, 100) : Math.min(pctOfSpending, 100);

          return (
            <li
              key={cat.id}
              className={`px-5 py-4 group transition-colors duration-150 hover:bg-white/[0.02] ${i > 0 ? "border-t border-[#1a1a1a]" : ""}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm text-white truncate">{cat.name}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-semibold tabular-nums text-white">${fmt(cat.amount)}</span>
                  <button
                    onClick={() => onDelete(cat.id)}
                    className="opacity-0 group-hover:opacity-100 text-[#555] hover:text-[#ff4444] transition-all duration-150 text-xs w-5 h-5 flex items-center justify-center rounded hover:bg-[#ff4444]/10"
                    aria-label={`Delete ${cat.name}`}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2.5 pl-[18px]">
                {salary > 0 && (
                  <span className="text-xs text-[#555]">
                    <span className="text-[#888]">{pctOfSalary.toFixed(1)}%</span> of income
                  </span>
                )}
                {totalSpent > 0 && salary > 0 && <span className="text-[#333]">·</span>}
                {totalSpent > 0 && (
                  <span className="text-xs text-[#555]">
                    <span className="text-[#888]">{pctOfSpending.toFixed(1)}%</span> of spending
                  </span>
                )}
              </div>

              <div className="h-[3px] bg-[#1a1a1a] rounded-full overflow-hidden ml-[18px]">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${barWidth}%`, backgroundColor: cat.color }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[#222] bg-[#0a0a0a] flex justify-between items-center">
        <span className="text-xs font-mono uppercase tracking-widest text-[#666]">Total</span>
        <div>
          <span className="text-base font-semibold tabular-nums text-white">${fmt(totalSpent)}</span>
          {salary > 0 && (
            <span className="text-xs text-[#555] ml-2">
              ({((totalSpent / salary) * 100).toFixed(1)}%)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
