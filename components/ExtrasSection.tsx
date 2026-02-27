"use client";

import { useState, useRef } from "react";

type Extra = { id: string; name: string; amount: number };

interface ExtrasSectionProps {
  extras: Extra[];
  onAdd: (name: string, amount: number) => void;
  onDelete: (id: string) => void;
}

function fmt(v: number) {
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ExtrasSection({ extras, onAdd, onDelete }: ExtrasSectionProps) {
  const [name, setName] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const total = extras.reduce((s, e) => s + e.amount, 0);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    const num = parseFloat(amountRaw.replace(/,/g, ""));
    if (!trimmed) { setError("Name is required."); return; }
    if (isNaN(num) || num <= 0) { setError("Enter a valid amount greater than 0."); return; }
    onAdd(trimmed, num);
    setName("");
    setAmountRaw("");
    setError("");
    setTimeout(() => nameRef.current?.focus(), 0);
  }

  return (
    <div className="card p-5 hover:border-[#444] transition-colors duration-200">
      <p className="text-xs font-mono uppercase tracking-widest text-[#666] mb-4">
        Extra Income
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            ref={nameRef}
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); if (error) setError(""); }}
            placeholder="Bonus, freelance…"
            className="field"
          />
          <div className="relative flex-shrink-0">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] text-sm select-none pointer-events-none">
              $
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={amountRaw}
              onChange={(e) => { setAmountRaw(e.target.value); if (error) setError(""); }}
              onKeyDown={handleKeyDown}
              placeholder="0.00"
              className="field w-32 !pl-7"
            />
          </div>
          <button type="submit" className="btn">
            Add
          </button>
        </div>
        {error && <p className="text-[#ff4444] text-xs">{error}</p>}
      </form>

      {extras.length > 0 && (
        <ul className="flex flex-col gap-2 mt-4">
          {extras.map((ex) => (
            <li
              key={ex.id}
              className="flex items-center justify-between group rounded-lg px-3 py-2.5 bg-[#50e3c2]/[0.04] border border-[#50e3c2]/10 hover:border-[#50e3c2]/25 transition-colors duration-150"
            >
              <span className="text-sm text-white">{ex.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold tabular-nums text-[#50e3c2]">
                  +${fmt(ex.amount)}
                </span>
                <button
                  onClick={() => onDelete(ex.id)}
                  className="opacity-0 group-hover:opacity-100 text-[#555] hover:text-[#ff4444] transition-all duration-150 text-xs w-5 h-5 flex items-center justify-center rounded hover:bg-[#ff4444]/10"
                  aria-label={`Remove ${ex.name}`}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
          <div className="flex justify-between items-center pt-1 px-1">
            <span className="text-xs font-mono uppercase tracking-widest text-[#666]">Total extra</span>
            <span className="text-sm font-semibold tabular-nums text-[#50e3c2]">+${fmt(total)}</span>
          </div>
        </ul>
      )}
    </div>
  );
}
