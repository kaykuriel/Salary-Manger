"use client";

interface MonthNavProps {
  monthKey: string;
  onPrev: () => void;
  onNext: () => void;
  onReload: () => void;
  loading?: boolean;
}

function formatMonthKey(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default function MonthNav({ monthKey, onPrev, onNext, onReload, loading }: MonthNavProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-1">
      <button
        onClick={onPrev}
        className="w-8 h-8 flex items-center justify-center border border-[#280000] text-[#555] hover:text-white hover:border-[#cc0000] active:scale-90 transition-all duration-150 rounded-lg text-base leading-none"
        aria-label="Previous month"
      >
        ‹
      </button>

      <div className="flex items-center gap-2 min-w-[200px] justify-center">
        <span className="text-base font-semibold text-white tracking-tight select-none">
          {formatMonthKey(monthKey)}
        </span>
        <button
          onClick={onReload}
          disabled={loading}
          className={`w-6 h-6 flex items-center justify-center rounded transition-all duration-150 active:scale-90 text-base leading-none
            ${loading
              ? "animate-spin text-[#cc0000] cursor-not-allowed"
              : "text-[#333] hover:text-[#888]"
            }`}
          aria-label="Reload"
          title="Reload"
        >
          ↻
        </button>
      </div>

      <button
        onClick={onNext}
        className="w-8 h-8 flex items-center justify-center border border-[#280000] text-[#555] hover:text-white hover:border-[#cc0000] active:scale-90 transition-all duration-150 rounded-lg text-base leading-none"
        aria-label="Next month"
      >
        ›
      </button>
    </div>
  );
}
