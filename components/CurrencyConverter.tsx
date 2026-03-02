"use client";

import { useState, useEffect, useCallback } from "react";

const FIAT = [
  { code: "USD", name: "US Dollar"        },
  { code: "EUR", name: "Euro"             },
  { code: "GBP", name: "British Pound"    },
  { code: "BRL", name: "Brazilian Real"   },
  { code: "JPY", name: "Japanese Yen"     },
  { code: "CAD", name: "Canadian Dollar"  },
  { code: "AUD", name: "Australian Dollar"},
  { code: "CHF", name: "Swiss Franc"      },
  { code: "MXN", name: "Mexican Peso"     },
  { code: "CNY", name: "Chinese Yuan"     },
  { code: "KRW", name: "Korean Won"       },
  { code: "INR", name: "Indian Rupee"     },
  { code: "SEK", name: "Swedish Krona"    },
  { code: "NOK", name: "Norwegian Krone"  },
  { code: "PLN", name: "Polish Złoty"     },
];

const CRYPTO = [
  { code: "BTC",   name: "Bitcoin",   geckoId: "bitcoin"       },
  { code: "ETH",   name: "Ethereum",  geckoId: "ethereum"      },
  { code: "BNB",   name: "BNB",       geckoId: "binancecoin"   },
  { code: "SOL",   name: "Solana",    geckoId: "solana"        },
  { code: "XRP",   name: "XRP",       geckoId: "ripple"        },
  { code: "ADA",   name: "Cardano",   geckoId: "cardano"       },
  { code: "DOGE",  name: "Dogecoin",  geckoId: "dogecoin"      },
  { code: "AVAX",  name: "Avalanche", geckoId: "avalanche-2"   },
  { code: "DOT",   name: "Polkadot",  geckoId: "polkadot"      },
  { code: "MATIC", name: "Polygon",   geckoId: "matic-network" },
];

type RatesMap = Record<string, number>;

function fmtResult(v: number, code: string): string {
  const isCrypto = CRYPTO.some((c) => c.code === code);
  if (isCrypto) {
    return v >= 1
      ? v.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })
      : v.toLocaleString("en-US", { minimumFractionDigits: 8, maximumFractionDigits: 8 });
  }
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPrice(v: number): string {
  if (v >= 1000) return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (v >= 1)    return v.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  return v.toLocaleString("en-US", { minimumFractionDigits: 6, maximumFractionDigits: 6 });
}

// Shared select style — dark bg so it stays dark even when focused/open
const SELECT_CLS = "w-40 flex-shrink-0 cursor-pointer bg-[#060000] border border-[#280000] rounded-lg px-3 py-2 text-sm text-white outline-none transition-all duration-150 focus:border-[#cc0000] focus:ring-1 focus:ring-[#cc0000]/20";

export default function CurrencyConverter() {
  const [rates,    setRates]    = useState<RatesMap | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error,    setError]    = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  // Amount input
  const [amountRaw, setAmountRaw] = useState("1");
  const [amountFocused, setAmountFocused] = useState(false);

  const [from, setFrom] = useState("USD");
  const [to,   setTo]   = useState("BRL");

  const amountNum = parseFloat(amountRaw.replace(/,/g, "")) || 0;

  const amountDisplay = amountFocused
    ? amountRaw
    : amountNum > 0
    ? amountNum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : amountRaw;

  const fetchRates = useCallback(async () => {
    setFetching(true);
    setError("");
    try {
      const geckoIds = CRYPTO.map((c) => c.geckoId).join(",");
      const [fiatRes, cryptoRes] = await Promise.all([
        fetch("https://api.frankfurter.app/latest?from=USD"),
        fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${geckoIds}&vs_currencies=usd`),
      ]);
      const fiatData   = await fiatRes.json();
      const cryptoData = await cryptoRes.json();

      const map: RatesMap = { USD: 1 };
      for (const [code, rate] of Object.entries(fiatData.rates as Record<string, number>)) {
        map[code] = 1 / rate;
      }
      for (const crypto of CRYPTO) {
        const price = (cryptoData[crypto.geckoId] as { usd?: number })?.usd;
        if (price) map[crypto.code] = price;
      }
      setRates(map);
      setUpdatedAt(new Date());
    } catch {
      setError("Could not fetch rates. Check your connection.");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  function convert(amt: number, f: string, t: string): number | null {
    if (!rates) return null;
    const a = rates[f], b = rates[t];
    if (!a || !b) return null;
    return (amt * a) / b;
  }

  const result   = convert(amountNum, from, to);
  const unitRate = convert(1, from, to);

  const updatedAgo = updatedAt ? (() => {
    const s = Math.floor((Date.now() - updatedAt.getTime()) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
  })() : "";

  const selectContent = (
    <>
      <optgroup label="── Fiat ──">
        {FIAT.map((f) => <option key={f.code} value={f.code}>{f.code} — {f.name}</option>)}
      </optgroup>
      <optgroup label="── Crypto ──">
        {CRYPTO.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
      </optgroup>
    </>
  );

  return (
    <main className="py-8 px-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-5">

        {/* Title */}
        <div className="flex items-center justify-center gap-2 py-1">
          <span className="text-base font-semibold text-white tracking-tight select-none">Converter</span>
          <button
            onClick={fetchRates}
            disabled={fetching}
            className={`w-6 h-6 flex items-center justify-center rounded text-base transition-all active:scale-90 ${fetching ? "animate-spin text-[#cc0000]" : "text-[#333] hover:text-[#888]"}`}
            title="Refresh rates"
          >
            ↻
          </button>
          {updatedAt && !fetching && (
            <span className="text-xs text-[#444]">· {updatedAgo}</span>
          )}
        </div>

        {/* Converter card */}
        <div className="card p-5 hover:border-[#3a0000]">
          {error && <p className="text-[#ff2222] text-xs mb-4">{error}</p>}
          <div className="flex flex-col gap-3">

            {/* FROM */}
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={amountDisplay}
                onChange={(e) => setAmountRaw(e.target.value)}
                onFocus={() => setAmountFocused(true)}
                onBlur={() => setAmountFocused(false)}
                onKeyDown={(e) => { if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault(); }}
                placeholder="1.00"
                className="field text-xl font-semibold"
              />
              <select value={from} onChange={(e) => setFrom(e.target.value)} className={SELECT_CLS}>
                {selectContent}
              </select>
            </div>

            {/* Swap */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#1a0000]" />
              <button
                onClick={() => { setFrom(to); setTo(from); }}
                className="text-[#444] hover:text-white transition-all duration-150 w-8 h-8 flex items-center justify-center border border-[#280000] rounded-lg text-sm active:scale-90 hover:border-[#cc0000]"
                title="Swap"
              >
                ⇅
              </button>
              <div className="flex-1 h-px bg-[#1a0000]" />
            </div>

            {/* TO */}
            <div className="flex gap-2">
              <div className="flex-1 bg-[#060000] border border-[#280000] rounded-lg px-3 py-2 flex items-center min-h-[42px]">
                {fetching ? (
                  <span className="text-[#444] text-sm">Loading…</span>
                ) : result !== null ? (
                  <span className="text-xl font-semibold text-white tabular-nums">{fmtResult(result, to)}</span>
                ) : (
                  <span className="text-[#444] text-sm">—</span>
                )}
              </div>
              <select value={to} onChange={(e) => setTo(e.target.value)} className={SELECT_CLS}>
                {selectContent}
              </select>
            </div>

            {unitRate !== null && !fetching && (
              <p className="text-xs text-[#555] text-center">
                1 {from} = {fmtResult(unitRate, to)} {to}
              </p>
            )}
          </div>
        </div>

        {/* Crypto prices */}
        {rates && (
          <div className="card overflow-hidden hover:border-[#3a0000]">
            <div className="px-5 py-3 border-b border-[#1e0000]">
              <p className="text-xs font-mono uppercase tracking-widest text-[#666]">Crypto Prices (USD)</p>
            </div>
            <ul>
              {CRYPTO.map((c, i) => {
                const price = rates[c.code];
                return (
                  <li
                    key={c.code}
                    className={`px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors duration-150 cursor-pointer ${i > 0 ? "border-t border-[#1a0000]" : ""}`}
                    onClick={() => { setFrom(c.code); setTo("USD"); }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-semibold text-white w-14">{c.code}</span>
                      <span className="text-xs text-[#555]">{c.name}</span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-[#ff9090]">
                      ${price ? fmtPrice(price) : "—"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Fiat rates */}
        {rates && (
          <div className="card overflow-hidden hover:border-[#3a0000]">
            <div className="px-5 py-3 border-b border-[#1e0000]">
              <p className="text-xs font-mono uppercase tracking-widest text-[#666]">Fiat Rates (per 1 USD)</p>
            </div>
            <div className="grid grid-cols-2">
              {FIAT.filter((f) => f.code !== "USD").map((f, i) => {
                const perUsd = rates[f.code] ? 1 / rates[f.code] : null;
                return (
                  <div
                    key={f.code}
                    className={`px-5 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors duration-150 cursor-pointer
                      ${i % 2 === 1 ? "border-l border-[#1a0000]" : ""}
                      ${i >= 2    ? "border-t border-[#1a0000]" : ""}
                    `}
                    onClick={() => { setFrom("USD"); setTo(f.code); }}
                  >
                    <span className="text-sm text-[#888]">{f.code}</span>
                    <span className="text-sm font-semibold tabular-nums text-white">
                      {perUsd
                        ? perUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                        : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
