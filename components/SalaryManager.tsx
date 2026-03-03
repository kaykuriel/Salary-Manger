"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import MonthNav from "./MonthNav";
import SalaryInput from "./SalaryInput";
import ExtrasSection from "./ExtrasSection";
import CategoryForm from "./CategoryForm";
import CategoryList from "./CategoryList";
import SummaryCards from "./SummaryCards";
import ExpenseChart from "./ExpenseChart";

type Category = { id: string; name: string; amount: number; color: string };
type Extra = { id: string; name: string; amount: number };
type MonthData = { salary: number; categories: Category[]; extras: Extra[] };

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

const empty = (): MonthData => ({ salary: 0, categories: [], extras: [] });

function parseMonthData(data: Record<string, unknown> | null): MonthData {
  if (!data) return empty();

  const rawCats = Array.isArray(data.categories) ? data.categories : [];
  const categories: Category[] = rawCats.map((c: unknown) => {
    const cat = (c ?? {}) as Record<string, unknown>;
    return {
      id:     typeof cat.id     === "string" ? cat.id : crypto.randomUUID(),
      name:   typeof cat.name   === "string" ? cat.name : "Unnamed",
      amount: Number(cat.amount) || 0,
      color:  typeof cat.color  === "string" ? cat.color : "#0070f3",
    };
  });

  const rawExtras = Array.isArray(data.extras) ? data.extras : [];
  const extras: Extra[] = rawExtras.map((e: unknown) => {
    const ex = (e ?? {}) as Record<string, unknown>;
    return {
      id:     typeof ex.id     === "string" ? ex.id : crypto.randomUUID(),
      name:   typeof ex.name   === "string" ? ex.name : "Extra",
      amount: Number(ex.amount) || 0,
    };
  });

  return {
    salary: Number(data.salary) || 0,
    categories,
    extras,
  };
}

export default function SalaryManager({ userId: _userId, onSaved, onSaveFail }: { userId: string; onSaved?: () => void; onSaveFail?: () => void }) {
  const [monthKey, setMonthKey] = useState(() => getMonthKey(new Date()));
  const [monthData, setMonthData] = useState<MonthData>(empty());
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "ok" | "fail">("idle");
  const justLoadedRef = useRef(false);
  const isReloadRef = useRef(false);
  const [fetchKey, setFetchKey] = useState(0);

  // For the typing debounce fallback (salary field while typing)
  const latestMonthKeyRef = useRef(monthKey);
  const latestDataRef = useRef(monthData);
  const isDirtyRef = useRef(false);

  const reload = useCallback(() => {
    isReloadRef.current = true;
    setFetchKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const isReload = isReloadRef.current;
    isReloadRef.current = false;

    if (!isReload) {
      setHydrated(false);
    } else {
      setLoading(true);
    }
    justLoadedRef.current = false;

    fetch(`/api/data/${monthKey}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        justLoadedRef.current = true;
        setMonthData(parseMonthData(data));
        setHydrated(true);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        justLoadedRef.current = true;
        setMonthData(empty());
        setHydrated(true);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [monthKey, fetchKey]);

  // Typing debounce — only fires if user was typing but didn't blur
  useEffect(() => {
    latestMonthKeyRef.current = monthKey;
    latestDataRef.current = monthData;

    if (!hydrated) return;
    if (justLoadedRef.current) {
      justLoadedRef.current = false;
      isDirtyRef.current = false;
      return;
    }
    isDirtyRef.current = true;
    const timer = setTimeout(() => {
      isDirtyRef.current = false;
      fetch(`/api/data/${monthKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(monthData),
      })
        .then((r) => r.ok ? r.json() : null)
        .then((j) => { if (j?.ok) onSaved?.(); })
        .catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [monthData, hydrated, monthKey]);

  // Keepalive on unmount — saves any uncommitted typing
  useEffect(() => {
    return () => {
      if (!isDirtyRef.current) return;
      fetch(`/api/data/${latestMonthKeyRef.current}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(latestDataRef.current),
        keepalive: true,
      }).catch(() => {});
    };
  }, []);

  // Direct save — called immediately for every explicit user action
  function saveNow(data: MonthData) {
    isDirtyRef.current = false;
    setSaveStatus("saving");
    fetch(`/api/data/${monthKey}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok) {
          setSaveStatus("ok");
          setTimeout(() => setSaveStatus("idle"), 2000);
          onSaved?.();
        } else {
          setSaveStatus("fail");
          onSaveFail?.();
          console.error("Save failed:", j);
        }
      })
      .catch((e) => {
        setSaveStatus("fail");
        onSaveFail?.();
        console.error("Save error:", e);
      });
  }

  function handleReset() {
    justLoadedRef.current = true;
    isDirtyRef.current = false;
    setMonthData(empty());
    setShowResetConfirm(false);
    fetch(`/api/data/${monthKey}`, { method: "DELETE" })
      .then(() => onSaved?.())
      .catch(() => {});
  }

  const totalSpent = monthData.categories.reduce((s, c) => s + c.amount, 0);
  const totalIncome = monthData.salary + monthData.extras.reduce((s, e) => s + e.amount, 0);

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
        {saveStatus === "fail" && (
          <div className="px-4 py-2 bg-[#ff4444]/10 border border-[#ff4444]/30 rounded-lg text-xs text-[#ff4444] text-center">
            Save failed — check your Supabase connection
          </div>
        )}
        <MonthNav
          monthKey={monthKey}
          onPrev={() => setMonthKey((k) => shiftMonth(k, -1))}
          onNext={() => setMonthKey((k) => shiftMonth(k, 1))}
          onReload={reload}
          loading={loading}
          saveStatus={saveStatus}
        />
        <SalaryInput
          salary={monthData.salary}
          onSave={(v) => {
            const next = { ...monthData, salary: v };
            setMonthData(next);
            saveNow(next);
          }}
          onResetRequest={() => setShowResetConfirm(true)}
        />
        <ExtrasSection
          extras={monthData.extras}
          onAdd={(name, amount) => {
            const next = { ...monthData, extras: [...monthData.extras, { id: crypto.randomUUID(), name, amount }] };
            setMonthData(next);
            saveNow(next);
          }}
          onDelete={(id) => {
            const next = { ...monthData, extras: monthData.extras.filter((e) => e.id !== id) };
            setMonthData(next);
            saveNow(next);
          }}
        />
        <SummaryCards salary={totalIncome} spent={totalSpent} />
        <CategoryForm
          onAdd={(name, amount) => {
            const next: MonthData = {
              ...monthData,
              categories: [
                ...monthData.categories,
                {
                  id: crypto.randomUUID(),
                  name,
                  amount,
                  color: PALETTE[monthData.categories.length % PALETTE.length],
                },
              ],
            };
            setMonthData(next);
            saveNow(next);
          }}
        />
        <CategoryList
          categories={monthData.categories}
          salary={totalIncome}
          onDelete={(id) => {
            const next = { ...monthData, categories: monthData.categories.filter((c) => c.id !== id) };
            setMonthData(next);
            saveNow(next);
          }}
        />
        <ExpenseChart categories={monthData.categories} salary={totalIncome} />
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm bg-[#111] border border-[#333] rounded-xl shadow-2xl">
            <div className="p-6 flex flex-col gap-4">
              <p className="text-sm font-medium text-white">Reset this month?</p>
              <p className="text-xs text-[#666]">
                This will clear salary, categories, and extras for this month. This cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="btn-ghost border border-[#333] px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="text-sm px-4 py-2 bg-[#ff4444] hover:bg-red-600 active:scale-[0.97] text-white rounded-lg transition-all"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
