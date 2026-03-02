"use client";

import { useState, useRef } from "react";

interface CategoryFormProps {
  onAdd: (name: string, amount: number) => void;
}

function formatMoneyInput(value: string): string {
  let s = value;
  if (!s.includes(".")) {
    s = s.replace(/,(\d{0,2})$/, ".$1");
  }
  let clean = s.replace(/[^\d.]/g, "");
  const dotIdx = clean.indexOf(".");
  if (dotIdx !== -1) {
    clean = clean.slice(0, dotIdx + 1) + clean.slice(dotIdx + 1).replace(/\./g, "");
  }
  const [intPart = "", decPart] = clean.split(".");
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart !== undefined ? `${intFormatted}.${decPart}` : intFormatted;
}

export default function CategoryForm({ onAdd }: CategoryFormProps) {
  const [name,      setName]      = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [error,     setError]     = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAmountRaw(formatMoneyInput(e.target.value));
    if (error) setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    const num     = parseFloat(amountRaw.replace(/,/g, ""));
    if (!trimmed)               { setError("Category name is required."); return; }
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
        <div className="flex flex-wrap sm:flex-nowrap gap-2">
          <input
            ref={nameRef}
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); if (error) setError(""); }}
            placeholder="Category name"
            className="field"
          />
          <div className="relative flex-shrink-0">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] text-sm select-none pointer-events-none">$</span>
            <input
              type="text"
              inputMode="decimal"
              value={amountRaw}
              onChange={handleAmountChange}
              onKeyDown={(e) => { if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault(); }}
              placeholder="0.00"
              className="field w-full sm:w-32 !pl-7"
            />
          </div>
          <button type="submit" className="btn w-full sm:w-auto">Add</button>
        </div>
        {error && <p className="text-[#ff4444] text-xs">{error}</p>}
      </form>
    </div>
  );
}
