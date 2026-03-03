"use client";

import { useState, useEffect, useCallback } from "react";

type Goal = {
  id: string;
  name: string;
  target: number;
  current: number;
  color: string;
  icon: string;
};

const COLORS = [
  "#cc0000", "#0070f3", "#50e3c2", "#f5a623",
  "#7928ca", "#ff0080", "#06d6a0", "#ff6600",
];

const ICONS = [
  "🎯", "✈️", "🚗", "🏠", "💻", "📱",
  "🎓", "💍", "🎮", "🌴", "🏋️", "💰",
  "🎵", "🐾", "🛍️", "📷",
];

// Handles BR format (1.500,75) and US format (1,500.75)
function parseMoney(s: string): number {
  const t = s.trim();
  if (!t) return 0;
  const lastComma = t.lastIndexOf(",");
  const lastDot = t.lastIndexOf(".");
  if (lastComma > lastDot) {
    return parseFloat(t.replace(/\./g, "").replace(",", ".")) || 0;
  }
  return parseFloat(t.replace(/,/g, "")) || 0;
}

function fmt(v: number): string {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function RingChart({
  pct,
  color,
  size = 52,
}: {
  pct: number;
  color: string;
  size?: number;
}) {
  const sw = 5;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - Math.min(pct / 100, 1) * circ;
  const cx = size / 2;
  const done = pct >= 100;
  return (
    <svg
      width={size}
      height={size}
      style={{ transform: "rotate(-90deg)", position: "absolute", top: 0, left: 0 }}
    >
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#1a1a1a" strokeWidth={sw} />
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke={done ? "#50e3c2" : color}
        strokeWidth={sw}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.7s ease" }}
      />
    </svg>
  );
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
  const [showFunds, setShowFunds] = useState(false);
  const [fundsRaw, setFundsRaw] = useState("");
  const [fundsMode, setFundsMode] = useState<"add" | "withdraw">("add");
  const [editField, setEditField] = useState<"" | "name" | "current" | "target">("");
  const [editRaw, setEditRaw] = useState("");

  const icon = goal.icon || "🎯";
  const pct = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
  const done = pct >= 100;
  const remaining = Math.max(0, goal.target - goal.current);

  function startEdit(field: "name" | "current" | "target") {
    const val =
      field === "name"
        ? goal.name
        : field === "current"
        ? goal.current > 0
          ? String(goal.current)
          : ""
        : goal.target > 0
        ? String(goal.target)
        : "";
    setEditField(field);
    setEditRaw(val);
  }

  function saveEdit(field: "name" | "current" | "target", raw: string) {
    if (field === "name") {
      const t = raw.trim();
      if (t) onUpdate({ ...goal, name: t });
    } else {
      const v = parseMoney(raw);
      if (!isNaN(v) && v >= 0) onUpdate({ ...goal, [field]: v });
    }
    setEditField("");
    setEditRaw("");
  }

  function applyFunds() {
    const amt = parseMoney(fundsRaw);
    if (amt <= 0) return;
    const delta = fundsMode === "add" ? amt : -amt;
    onUpdate({ ...goal, current: Math.max(0, goal.current + delta) });
    setFundsRaw("");
    setShowFunds(false);
  }

  return (
    <div className="card p-5">
      <div className="flex gap-4">
        {/* Ring + icon */}
        <div className="relative flex-shrink-0" style={{ width: 52, height: 52 }}>
          <RingChart pct={pct} color={goal.color} size={52} />
          <span className="absolute inset-0 flex items-center justify-center text-xl select-none">
            {done ? "✓" : icon}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name */}
          <div className="flex items-start justify-between gap-2 mb-1">
            {editField === "name" ? (
              <input
                autoFocus
                className="field text-sm flex-1 py-0.5 h-7"
                value={editRaw}
                onChange={(e) => setEditRaw(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit("name", editRaw);
                  if (e.key === "Escape") {
                    setEditField("");
                    setEditRaw("");
                  }
                }}
                onBlur={() => saveEdit("name", editRaw)}
              />
            ) : (
              <button
                onClick={() => startEdit("name")}
                className="text-sm font-medium text-white hover:text-[#bbb] text-left truncate transition-colors"
                title="Click to rename"
              >
                {goal.name}
              </button>
            )}
            <button
              onClick={() => onDelete(goal.id)}
              className="text-[#333] hover:text-[#ff4444] transition-colors w-5 h-5 flex items-center justify-center rounded flex-shrink-0 text-xs"
            >
              ✕
            </button>
          </div>

          {/* Amounts — click to edit, no onBlur on amounts to avoid accidental save */}
          <div className="flex items-baseline gap-1.5 mb-2 flex-wrap">
            {editField === "current" ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  type="text"
                  inputMode="decimal"
                  value={editRaw}
                  onChange={(e) => setEditRaw(e.target.value)}
                  className="bg-transparent text-xs text-white border-b border-[#cc0000] outline-none w-28 tabular-nums font-mono"
                  placeholder="0,00"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit("current", editRaw);
                    if (e.key === "Escape") {
                      setEditField("");
                      setEditRaw("");
                    }
                  }}
                />
                <button
                  onClick={() => saveEdit("current", editRaw)}
                  className="text-[10px] text-[#50e3c2] px-1 hover:text-white transition-colors"
                >
                  ✓
                </button>
                <button
                  onClick={() => {
                    setEditField("");
                    setEditRaw("");
                  }}
                  className="text-[10px] text-[#555] px-1 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => startEdit("current")}
                className="text-xs tabular-nums font-mono transition-colors hover:text-white"
                style={{ color: done ? "#50e3c2" : "#888" }}
                title="Click to set saved amount"
              >
                R${fmt(goal.current)}
              </button>
            )}
            <span className="text-xs text-[#333]">/</span>
            {editField === "target" ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  type="text"
                  inputMode="decimal"
                  value={editRaw}
                  onChange={(e) => setEditRaw(e.target.value)}
                  className="bg-transparent text-xs text-[#555] border-b border-[#444] outline-none w-28 tabular-nums font-mono"
                  placeholder="0,00"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit("target", editRaw);
                    if (e.key === "Escape") {
                      setEditField("");
                      setEditRaw("");
                    }
                  }}
                />
                <button
                  onClick={() => saveEdit("target", editRaw)}
                  className="text-[10px] text-[#50e3c2] px-1 hover:text-white transition-colors"
                >
                  ✓
                </button>
                <button
                  onClick={() => {
                    setEditField("");
                    setEditRaw("");
                  }}
                  className="text-[10px] text-[#555] px-1 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => startEdit("target")}
                className="text-xs text-[#555] hover:text-[#888] transition-colors tabular-nums font-mono"
                title="Click to edit target"
              >
                R${fmt(goal.target)}
              </button>
            )}
            <span
              className="text-[10px] font-mono ml-auto tabular-nums flex-shrink-0"
              style={{ color: done ? "#50e3c2" : goal.color }}
            >
              {Math.min(pct, 100).toFixed(1)}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-[#111] rounded-full overflow-hidden mb-2">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(pct, 100)}%`,
                backgroundColor: done ? "#50e3c2" : goal.color,
              }}
            />
          </div>

          {/* Status */}
          {done ? (
            <p className="text-[10px] text-[#50e3c2] font-mono mb-3">Goal reached!</p>
          ) : (
            <p className="text-[10px] text-[#444] mb-3 tabular-nums">
              R${fmt(remaining)} to go
            </p>
          )}

          {/* Add / withdraw */}
          {!done &&
            (showFunds ? (
              <div className="flex flex-col gap-2">
                <div className="flex gap-1">
                  <button
                    onClick={() => setFundsMode("add")}
                    className={`text-[10px] px-2.5 py-1 rounded-md transition-all ${
                      fundsMode === "add"
                        ? "text-white border border-[#cc0000]/50 bg-[#cc0000]/10"
                        : "text-[#555] border border-transparent hover:text-[#888]"
                    }`}
                  >
                    + Add
                  </button>
                  <button
                    onClick={() => setFundsMode("withdraw")}
                    className={`text-[10px] px-2.5 py-1 rounded-md transition-all ${
                      fundsMode === "withdraw"
                        ? "text-white border border-[#555] bg-[#222]"
                        : "text-[#555] border border-transparent hover:text-[#888]"
                    }`}
                  >
                    − Withdraw
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={fundsRaw}
                    onChange={(e) => setFundsRaw(e.target.value)}
                    placeholder="0,00"
                    className="field flex-1 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applyFunds();
                      if (e.key === "Escape") {
                        setShowFunds(false);
                        setFundsRaw("");
                      }
                    }}
                  />
                  <button onClick={applyFunds} className="btn text-xs px-3">
                    OK
                  </button>
                  <button
                    onClick={() => {
                      setShowFunds(false);
                      setFundsRaw("");
                    }}
                    className="btn-ghost border border-[#333] text-xs px-2"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowFunds(true)}
                className="btn-ghost border border-[#1e1e1e] hover:border-[#333] text-[10px] px-3 py-1 w-full transition-colors"
              >
                + Add funds
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

export default function GoalsManager() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState(false);
  const [name, setName] = useState("");
  const [targetRaw, setTargetRaw] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState(ICONS[0]);

  const load = useCallback(() => {
    fetch("/api/goals")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setGoals(d?.goals ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function persist(newGoals: Goal[]) {
    setSaving(true);
    setSaveErr(false);
    try {
      const r = await fetch("/api/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals: newGoals }),
      });
      if (!r.ok) setSaveErr(true);
    } catch {
      setSaveErr(true);
    }
    setSaving(false);
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    const num = parseMoney(targetRaw);
    if (!trimmed || num <= 0) return;
    const next: Goal[] = [
      ...goals,
      { id: crypto.randomUUID(), name: trimmed, target: num, current: 0, color, icon },
    ];
    setGoals(next);
    persist(next);
    setName("");
    setTargetRaw("");
  }

  function handleUpdate(updated: Goal) {
    const next = goals.map((g) => (g.id === updated.id ? updated : g));
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
  const overallPct =
    totalTarget > 0 ? Math.min((totalCurrent / totalTarget) * 100, 100) : 0;

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
          <h1 className="text-base font-semibold text-white tracking-tight">
            Financial Goals
          </h1>
          <span
            className={`text-[10px] font-mono transition-opacity duration-300 ${
              saving
                ? "text-[#555] opacity-100"
                : saveErr
                ? "text-[#ff4444] opacity-100"
                : "opacity-0"
            }`}
          >
            {saveErr ? "save failed" : "saving…"}
          </span>
        </div>

        {/* Overview — 2+ goals */}
        {goals.length > 1 && (
          <div className="card p-4 flex gap-4 items-center">
            {/* Large ring for overall */}
            <div className="relative flex-shrink-0" style={{ width: 72, height: 72 }}>
              <RingChart pct={overallPct} color="#cc0000" size={72} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-mono font-bold text-white leading-none">
                  {overallPct.toFixed(0)}%
                </span>
                <span className="text-[9px] text-[#444] leading-none mt-0.5">total</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {/* Segmented bar */}
              <div className="flex h-2 rounded-full overflow-hidden gap-[2px] mb-2">
                {goals.map((g) => {
                  const segW =
                    totalTarget > 0
                      ? (g.target / totalTarget) * 100
                      : 100 / goals.length;
                  const fillPct =
                    g.target > 0 ? Math.min(g.current / g.target, 1) * 100 : 0;
                  return (
                    <div
                      key={g.id}
                      className="relative overflow-hidden rounded-sm"
                      style={{ flex: `${segW} 0 0`, background: "#111" }}
                    >
                      <div
                        className="absolute inset-y-0 left-0 transition-all duration-700"
                        style={{ width: `${fillPct}%`, backgroundColor: g.color }}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between mb-2">
                <span className="text-[10px] text-[#555] tabular-nums font-mono">
                  R${fmt(totalCurrent)} saved
                </span>
                <span className="text-[10px] text-[#444] tabular-nums font-mono">
                  R${fmt(totalTarget)} total
                </span>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {goals.map((g) => (
                  <div key={g.id} className="flex items-center gap-1">
                    <span className="text-xs">{g.icon || "🎯"}</span>
                    <span className="text-[9px] text-[#555] truncate max-w-[72px]">
                      {g.name}
                    </span>
                    <span
                      className="text-[9px] font-mono tabular-nums"
                      style={{ color: g.color }}
                    >
                      {(g.target > 0 ? (g.current / g.target) * 100 : 0).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {goals.length === 0 && (
          <div className="card p-10 text-center flex flex-col gap-2 items-center">
            <span className="text-3xl mb-1">🎯</span>
            <p className="text-[#555] text-sm">No goals yet.</p>
            <p className="text-[#444] text-xs">
              Create a goal below to start tracking your savings.
            </p>
          </div>
        )}

        {/* Goal cards */}
        {goals.map((g) => (
          <GoalCard key={g.id} goal={g} onUpdate={handleUpdate} onDelete={handleDelete} />
        ))}

        {/* Add goal form */}
        <div className="card p-5">
          <p className="text-xs font-mono uppercase tracking-widest text-[#666] mb-4">
            New Goal
          </p>
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            {/* Name + selected icon preview */}
            <div className="flex gap-2 items-center">
              <span className="text-2xl w-10 flex-shrink-0 text-center select-none">
                {icon}
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Goal name (e.g. Japan trip, laptop…)"
                className="field flex-1"
              />
            </div>

            {/* Icon picker */}
            <div className="flex flex-wrap gap-1 pl-12">
              {ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`w-8 h-8 text-base rounded flex items-center justify-center transition-all ${
                    icon === ic
                      ? "bg-white/10 ring-1 ring-white/20 scale-110"
                      : "hover:bg-white/5 opacity-60 hover:opacity-100"
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>

            {/* Target + color */}
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] text-sm pointer-events-none">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={targetRaw}
                  onChange={(e) => setTargetRaw(e.target.value)}
                  placeholder="Target amount"
                  className="field w-full !pl-9"
                />
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-5 h-5 rounded-full transition-all flex-shrink-0"
                    style={{
                      backgroundColor: c,
                      transform: color === c ? "scale(1.35)" : "scale(1)",
                      outline:
                        color === c ? "2px solid rgba(255,255,255,0.35)" : "none",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
            </div>

            <button type="submit" className="btn">
              Add Goal
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
