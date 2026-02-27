"use client";

import { useState, useRef } from "react";

interface CategoryFormProps {
  onAdd: (name: string, amount: number) => void;
}

export default function CategoryForm({ onAdd }: CategoryFormProps) {
  const [name,          setName]          = useState("");
  const [amountRaw,     setAmountRaw]     = useState("");
  const [amountFocused, setAmountFocused] = useState(false);
  const [error,         setError]         = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const amountDisplay = amountFocused
    ? amountRaw
    : amountRaw && !isNaN(parseFloat(amountRaw.replace(/,/g, "")))
    ? parseFloat(amountRaw.replace(/,/g, "")).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : amountRaw;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    const num     = parseFloat(amountRaw.replace(/,/g, ""));
    if (!trimmed)              { setError("Category name is required."); return; }
    if (isNaN(num) || num <= 0) { setError("Enter a valid amount greater than 0."); return; }
    onAdd(trimmed, num);
    setName("");
    setAmountRaw("");
    setError("");
    setTimeout(() => nameRef.current?.focus(), 0);
  }

  return (
    <div className="card p-5 hover:border-[#444]">
      <p className="text-xs font-mono uppercase tracking-widest text-[#666] mb-4">
        Add Expense
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            ref={nameRef}
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); if (error) setError(""); }}
            placeholder="Category name"
            className="field"
          />
          <div className="relative flex-shrink-0">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] text-sm select-none pointer-events-none">
              $
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={amountDisplay}
              onChange={(e) => { setAmountRaw(e.target.value); if (error) setError(""); }}
              onFocus={() => setAmountFocused(true)}
              onBlur={() => setAmountFocused(false)}
              onKeyDown={(e) => { if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault(); }}
              placeholder="0.00"
              className="field w-32 !pl-7"
            />
          </div>
          <button type="submit" className="btn">Add</button>
        </div>
        {error && <p className="text-[#ff4444] text-xs">{error}</p>}
      </form>
    </div>
  );
}
