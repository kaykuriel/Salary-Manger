"use client";

import { useState, useEffect, useRef } from "react";

interface SalaryInputProps {
  salary: number;
  onSave: (value: number) => void;
}

export default function SalaryInput({ salary, onSave }: SalaryInputProps) {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync when month changes
  useEffect(() => {
    if (!focused) {
      setRaw(salary > 0 ? String(salary) : "");
    }
  }, [salary, focused]);

  function handleFocus() {
    setFocused(true);
    setRaw(salary > 0 ? String(salary) : "");
    // Select all text so user can immediately replace
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function commit() {
    setFocused(false);
    const num = parseFloat(raw);
    if (!isNaN(num) && num >= 0) {
      onSave(num);
    } else {
      // Restore last valid value
      setRaw(salary > 0 ? String(salary) : "");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    // Block characters that make no sense in a money field
    if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      setRaw(salary > 0 ? String(salary) : "");
      inputRef.current?.blur();
    }
  }

  const display = focused ? raw : salary > 0
    ? salary.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "";

  return (
    <div className="card p-5 hover:border-[#444]">
      <label className="block text-xs font-mono uppercase tracking-widest text-[#666] mb-3">
        Monthly Salary
      </label>
      <div className="flex items-baseline gap-2">
        <span className={`text-xl font-light transition-colors duration-200 ${focused ? "text-[#888]" : salary > 0 ? "text-[#555]" : "text-[#333]"}`}>
          $
        </span>
        <input
          ref={inputRef}
          type={focused ? "number" : "text"}
          value={display}
          onChange={(e) => setRaw(e.target.value)}
          onFocus={handleFocus}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          placeholder="0.00"
          className="flex-1 bg-transparent text-3xl font-semibold text-white placeholder-[#2a2a2a] outline-none border-b border-[#333] focus:border-[#0070f3] transition-colors duration-200 pb-0.5"
        />
      </div>
    </div>
  );
}
