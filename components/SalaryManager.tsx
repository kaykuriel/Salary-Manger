"use client";

import { useState, useEffect, useCallback } from "react";
import MonthNav from "./MonthNav";
import SalaryInput from "./SalaryInput";
import CategoryForm from "./CategoryForm";
import CategoryList from "./CategoryList";
import SummaryCards from "./SummaryCards";
import ExpenseChart from "./ExpenseChart";
import { getUserDataKey } from "@/lib/auth";

type Category = { id: string; name: string; amount: number; color: string };
type MonthData = { salary: number; categories: Category[] };
type AppData = { [monthKey: string]: MonthData };

// Colorful palette — works on black background
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

function loadData(key: string): AppData {
  if (typeof window === "undefined") return {};
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : {}; }
  catch { return {}; }
}

function saveData(key: string, data: AppData) {
  localStorage.setItem(key, JSON.stringify(data));
}

const empty = (): MonthData => ({ salary: 0, categories: [] });

export default function SalaryManager({ userId }: { userId: string }) {
  const storageKey = getUserDataKey(userId);
  const [monthKey, setMonthKey] = useState(() => getMonthKey(new Date()));
  const [appData, setAppData] = useState<AppData>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setAppData(loadData(storageKey)); setHydrated(true); }, [storageKey]);
  useEffect(() => { if (hydrated) saveData(storageKey, appData); }, [appData, hydrated, storageKey]);

  const month: MonthData = appData[monthKey] ?? empty();

  const update = useCallback((fn: (m: MonthData) => MonthData) => {
    setAppData((prev) => ({ ...prev, [monthKey]: fn(prev[monthKey] ?? empty()) }));
  }, [monthKey]);

  const totalSpent = month.categories.reduce((s, c) => s + c.amount, 0);

  if (!hydrated) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <span className="text-app-muted text-sm">Loading…</span>
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
        <SalaryInput salary={month.salary} onSave={(v) => update((m) => ({ ...m, salary: v }))} />
        <SummaryCards salary={month.salary} spent={totalSpent} />
        <CategoryForm
          onAdd={(name, amount) =>
            update((m) => ({
              ...m,
              categories: [
                ...m.categories,
                { id: crypto.randomUUID(), name, amount, color: PALETTE[m.categories.length % PALETTE.length] },
              ],
            }))
          }
        />
        <CategoryList
          categories={month.categories}
          salary={month.salary}
          onDelete={(id) => update((m) => ({ ...m, categories: m.categories.filter((c) => c.id !== id) }))}
        />
        <ExpenseChart categories={month.categories} salary={month.salary} />
      </div>
    </main>
  );
}
