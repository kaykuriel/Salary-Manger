"use client";

interface MonthNavProps {
  monthKey: string;
  onPrev: () => void;
  onNext: () => void;
}

function formatMonthKey(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default function MonthNav({ monthKey, onPrev, onNext }: MonthNavProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-1">
      <button
        onClick={onPrev}
        className="w-8 h-8 flex items-center justify-center border border-[#222] text-[#555] hover:text-white hover:border-[#0070f3] active:scale-90 transition-all duration-150 rounded-lg text-base leading-none"
        aria-label="Previous month"
      >
        ‹
      </button>
      <span className="text-base font-semibold text-white min-w-[200px] text-center tracking-tight select-none">
        {formatMonthKey(monthKey)}
      </span>
      <button
        onClick={onNext}
        className="w-8 h-8 flex items-center justify-center border border-[#222] text-[#555] hover:text-white hover:border-[#0070f3] active:scale-90 transition-all duration-150 rounded-lg text-base leading-none"
        aria-label="Next month"
      >
        ›
      </button>
    </div>
  );
}
