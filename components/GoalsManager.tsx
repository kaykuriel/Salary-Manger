"use client";

import { useState, useEffect, useCallback } from "react";

type Goal = {
  id: string;
  name: string;
  target: number;
  current: number;
  color: string;
};

const COLORS = [
  "#cc0000", "#0070f3", "#50e3c2", "#f5a623",
  "#7928ca", "#ff0080", "#06d6a0", "#ff6600",
];

function fmt(v: number) {
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatMoneyInput(value: string): string {
  let s = value.replace(/,(\d{0,2})$/, ".$1");
  let clean = s.replace(/[^\d.]/g, "");
  const dotIdx = clean.indexOf(".");
  if (dotIdx !== -1) clean = clean.slice(0, dotIdx + 1) + clean.slice(dotIdx + 1).replace(/\./g, "");
  const [intPart = "", decPart] = clean.split(".");
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart !== undefined ? `${intFormatted}.${decPart}` : intFormatted;
}

function GoalCard({
  goal,
  onUpdate,
  onDelete,
}: {
  goal: Goal;
  onUpdate: (g: Goal) => void;
  onDelete: (id: string) => void;
}) {
  const [addRaw, setAddRaw] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editCurrent, setEditCurrent] = useState(false);
  const [currentRaw, setCurrentRaw] = useState("");

  const pct = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
  const done = pct >= 100;

  function handleAdd() {
    const amt = parseFloat(addRaw.replace(/,/g, ""));
    if (isNaN(amt) || amt === 0) return;
    onUpdate({ ...goal, current: Math.max(0, goal.current + amt) });
    setAddRaw("");
    setShowAdd(false);
  }

  function handleSetCurrent() {
    const val = parseFloat(currentRaw.replace(/,/g, ""));
    if (!isNaN(val) && val >= 0) onUpdate({ ...goal, current: val });
    setEditCurrent(false);
    setCurrentRaw("");
  }

  return (
    <div className="card p-5 hover:border-[#333] transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{goal.name}</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            {editCurrent ? (
              <div className="flex items-center gap-1">
                <span className="text-xs text-[#555]">$</span>
                <input
                  type="text"
                  value={currentRaw}
                  onChange={(e) => setCurrentRaw(formatMoneyInput(e.target.value))}
                  className="bg-transparent text-xs text-white border-b border-[#cc0000] outline-none w-24"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") handleSetCurrent(); if (e.key === "Escape") setEditCurrent(false); }}
                  onBlur={handleSetCurrent}
                />
              </div>
            ) : (
              <button
                onClick={() => { setEditCurrent(true); setCurrentRaw(goal.current > 0 ? fmt(goal.current).replace(/,/g, "") : ""); }}
                className="text-xs text-[#888] hover:text-white transition-colors tabular-nums"
                title="Click to set saved amount"
              >
                ${fmt(goal.current)}
              </button>
            )}
            <span className="text-xs text-[#333]">/</span>
            <span className="text-xs text-[#555] tabular-nums">${fmt(goal.target)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-xs font-mono tabular-nums"
            style={{ color: done ? "#50e3c2" : goal.color }}
          >
            {pct.toFixed(1)}%
          </span>
          <button
            onClick={() => onDelete(goal.id)}
            className="text-[#333] hover:text-[#ff4444] transition-colors w-5 h-5 flex items-center justify-center rounded hover:bg-[#ff4444]/10 text-xs"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-[#111] rounded-full overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: done ? "#50e3c2" : goal.color }}
        />
      </div>

      {/* Remaining */}
      {!done && (
        <p className="text-[10px] text-[#444] mb-3 tabular-nums">
          ${fmt(goal.target - goal.current)} remaining
        </p>
      )}
      {done && (
        <p className="text-[10px] text-[#50e3c2] mb-3 font-mono">Goal reached!</p>
      )}

      {/* Add funds */}
      {!done && (
        showAdd ? (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] text-xs pointer-events-none">$</span>
              <input
                type="text"
                inputMode="decimal"
                value={addRaw}
                onChange={(e) => setAddRaw(formatMoneyInput(e.target.value))}
                placeholder="0.00"
                className="field w-full !pl-7 text-sm"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setShowAdd(false); }}
              />
            </div>
            <button onClick={handleAdd} className="btn text-xs px-3">Add</button>
            <button onClick={() => setShowAdd(false)} className="btn-ghost border border-[#333] text-xs px-3">✕</button>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="btn-ghost border border-[#333] text-xs px-3 py-1.5 w-full hover:border-[#555] transition-colors"
          >
            + Add funds
          </button>
        )
      )}
    </div>
  );
}

export default function GoalsManager() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [targetRaw, setTargetRaw] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  const load = useCallback(() => {
    fetch("/api/goals")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setGoals(d?.goals ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function persist(newGoals: Goal[]) {
    setSaving(true);
    await fetch("/api/goals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goals: newGoals }),
    }).catch(() => {});
    setSaving(false);
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    const num = parseFloat(targetRaw.replace(/,/g, ""));
    if (!trimmed || isNaN(num) || num <= 0) return;
    const next = [...goals, { id: crypto.randomUUID(), name: trimmed, target: num, current: 0, color }];
    setGoals(next);
    persist(next);
    setName("");
    setTargetRaw("");
  }

  function handleUpdate(updated: Goal) {
    const next = goals.map((g) => g.id === updated.id ? updated : g);
    setGoals(next);
    persist(next);
  }

  function handleDelete(id: string) {
    const next = goals.filter((g) => g.id !== id);
    setGoals(next);
    persist(next);
  }

  const totalTarget = goals.reduce((s, g) => s + g.target, 0);
  const totalCurrent = goals.reduce((s, g) => s + g.current, 0);
  const overallPct = totalTarget > 0 ? Math.min((totalCurrent / totalTarget) * 100, 100) : 0;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <span className="text-[#555] text-sm">Loading…</span>
      </main>
    );
  }

  return (
    <main className="py-8 px-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold text-white tracking-tight">Financial Goals</h1>
          {saving && <span className="text-[10px] font-mono text-[#555]">saving…</span>}
        </div>

        {/* Overall progress */}
        {goals.length > 1 && (
          <div className="card p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#555]">Overall</span>
              <span className="text-xs font-mono text-[#888]">{overallPct.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-[#111] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${overallPct}%`, backgroundColor: overallPct >= 100 ? "#50e3c2" : "#cc0000" }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-[#444] tabular-nums">${fmt(totalCurrent)} saved</span>
              <span className="text-[10px] text-[#444] tabular-nums">${fmt(totalTarget)} total</span>
            </div>
          </div>
        )}

        {/* Goal cards */}
        {goals.length === 0 ? (
          <div className="card p-8 text-center flex flex-col gap-2">
            <p className="text-[#555] text-sm">No goals yet.</p>
            <p className="text-[#444] text-xs">Create a goal below to start tracking your savings.</p>
          </div>
        ) : (
          goals.map((g) => (
            <GoalCard key={g.id} goal={g} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))
        )}

        {/* Add goal form */}
        <div className="card p-5">
          <p className="text-xs font-mono uppercase tracking-widest text-[#666] mb-4">New Goal</p>
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Goal name (e.g. Japan trip, new laptop…)"
              className="field"
            />
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <div className="relative flex-1 min-w-0">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] text-sm pointer-events-none">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={targetRaw}
                  onChange={(e) => setTargetRaw(formatMoneyInput(e.target.value))}
                  placeholder="Target amount"
                  className="field w-full !pl-7"
                />
              </div>
              <div className="flex gap-1.5 items-center flex-shrink-0">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-5 h-5 rounded-full transition-transform flex-shrink-0"
                    style={{
                      backgroundColor: c,
                      transform: color === c ? "scale(1.3)" : "scale(1)",
                      outline: color === c ? "2px solid rgba(255,255,255,0.3)" : "none",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
            </div>
            <button type="submit" className="btn">Add Goal</button>
          </form>
        </div>

      </div>
    </main>
  );
}
