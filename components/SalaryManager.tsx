"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import MonthNav from "./MonthNav";
import SalaryInput from "./SalaryInput";
import CategoryForm from "./CategoryForm";
import CategoryList from "./CategoryList";
import SummaryCards from "./SummaryCards";
import ExpenseChart from "./ExpenseChart";

type Category = { id: string; name: string; amount: number; color: string };
type MonthData = { salary: number; categories: Category[] };

const PALETTE = [
  "#0070f3", "#50e3c2", "#f5a623", "#7928ca",
  "#ff4444", "#ff0080", "#79ffe1", "#0070f3",
  "#00b4d8", "#06d6a0", "#ffd166", "#ef476f",
];

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(monthKey: string, delta: number) {
  const [y, m] = monthKey.split("-").map(Number);
  return getMonthKey(new Date(y, m - 1 + delta, 1));
}

const empty = (): MonthData => ({ salary: 0, categories: [] });

export default function SalaryManager({ userId }: { userId: string }) {
  const [monthKey, setMonthKey] = useState(() => getMonthKey(new Date()));
  const [monthData, setMonthData] = useState<MonthData>(empty());
  const [hydrated, setHydrated] = useState(false);
  // Prevents saving back data we just fetched from the server
  const justLoadedRef = useRef(false);

  // Fetch this month's data from the API whenever monthKey changes
  useEffect(() => {
    let cancelled = false;
    setHydrated(false);
    justLoadedRef.current = false;

    fetch(`/api/data/${monthKey}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        justLoadedRef.current = true;
        setMonthData(data ?? empty());
        setHydrated(true);
      })
      .catch(() => {
        if (cancelled) return;
        justLoadedRef.current = true;
        setMonthData(empty());
        setHydrated(true);
      });

    return () => { cancelled = true; };
  }, [monthKey]);

  // Debounced save — skips the first run after a fresh load
  useEffect(() => {
    if (!hydrated) return;
    if (justLoadedRef.current) {
      justLoadedRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/data/${monthKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(monthData),
      }).catch(() => {});
    }, 600);
    return () => clearTimeout(timer);
  }, [monthData, hydrated, monthKey]);

  const update = useCallback((fn: (m: MonthData) => MonthData) => {
    setMonthData((prev) => fn(prev));
  }, []);

  const totalSpent = monthData.categories.reduce((s, c) => s + c.amount, 0);

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
        <MonthNav
          monthKey={monthKey}
          onPrev={() => setMonthKey((k) => shiftMonth(k, -1))}
          onNext={() => setMonthKey((k) => shiftMonth(k, 1))}
        />
        <SalaryInput salary={monthData.salary} onSave={(v) => update((m) => ({ ...m, salary: v }))} />
        <SummaryCards salary={monthData.salary} spent={totalSpent} />
        <CategoryForm
          onAdd={(name, amount) =>
            update((m) => ({
              ...m,
              categories: [
                ...m.categories,
                {
                  id: crypto.randomUUID(),
                  name,
                  amount,
                  color: PALETTE[m.categories.length % PALETTE.length],
                },
              ],
            }))
          }
        />
        <CategoryList
          categories={monthData.categories}
          salary={monthData.salary}
          onDelete={(id) =>
            update((m) => ({ ...m, categories: m.categories.filter((c) => c.id !== id) }))
          }
        />
        <ExpenseChart categories={monthData.categories} salary={monthData.salary} />
      </div>
    </main>
  );
}
