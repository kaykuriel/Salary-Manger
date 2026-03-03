"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Config ─────────────────────────────────────────────────────────────────

const PAIRS = [
  { symbol: "BTCUSDT",  name: "Bitcoin",    short: "BTC"  },
  { symbol: "ETHUSDT",  name: "Ethereum",   short: "ETH"  },
  { symbol: "BNBUSDT",  name: "BNB",        short: "BNB"  },
  { symbol: "SOLUSDT",  name: "Solana",     short: "SOL"  },
  { symbol: "XRPUSDT",  name: "XRP",        short: "XRP"  },
  { symbol: "ADAUSDT",  name: "Cardano",    short: "ADA"  },
  { symbol: "DOGEUSDT", name: "Dogecoin",   short: "DOGE" },
  { symbol: "AVAXUSDT", name: "Avalanche",  short: "AVAX" },
  { symbol: "DOTUSDT",  name: "Polkadot",   short: "DOT"  },
  { symbol: "LINKUSDT", name: "Chainlink",  short: "LINK" },
];

const FIAT_CODES = ["EUR", "BRL", "GBP", "JPY", "CAD", "CHF", "AUD", "ARS", "MXN", "CNY"];

const WS_URL =
  "wss://stream.binance.com:9443/stream?streams=" +
  PAIRS.map((p) => `${p.symbol.toLowerCase()}@ticker`).join("/");

// ─── Types ───────────────────────────────────────────────────────────────────

type Ticker = {
  price: number;
  changePct: number;
  high: number;
  low: number;
  volUsdt: number;
  flash: "up" | "down" | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtPrice(v: number): string {
  if (v >= 10000) return v.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  if (v >= 1)     return v.toLocaleString("en-US", { maximumFractionDigits: 4, minimumFractionDigits: 2 });
  return v.toLocaleString("en-US", { maximumFractionDigits: 6, minimumFractionDigits: 4 });
}

function fmtVol(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000)     return `$${(v / 1_000_000).toFixed(1)}M`;
  return `$${(v / 1_000).toFixed(1)}K`;
}

function fmtResult(v: number): string {
  if (v === 0) return "0";
  if (v >= 1)  return v.toLocaleString("en-US", { maximumFractionDigits: 6 });
  return v.toFixed(10).replace(/\.?0+$/, "");
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function CurrencyConverter() {
  const [tickers, setTickers] = useState<Record<string, Ticker>>({});
  const [fiatRates, setFiatRates] = useState<Record<string, number>>({}); // X per 1 USD
  const [wsStatus, setWsStatus] = useState<"connecting" | "live" | "error">("connecting");
  const [fiatAge, setFiatAge] = useState<number | null>(null); // seconds since last fiat fetch

  const [fromAmt, setFromAmt] = useState("1");
  const [fromCur, setFromCur] = useState("BTC");
  const [toCur, setToCur] = useState("USDT");

  const wsRef = useRef<WebSocket | null>(null);
  const flashTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fiatTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const fiatAgeTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const fiatFetchedAt = useRef<number | null>(null);

  // ── WebSocket ──────────────────────────────────────────────────────────────

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    setWsStatus("connecting");
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => { if (mountedRef.current) setWsStatus("live"); };

    ws.onmessage = (evt) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(evt.data as string);
        const d = msg.data;
        if (!d || d.e !== "24hrTicker") return;
        const sym = d.s as string;
        const newPrice = parseFloat(d.c);

        setTickers((prev) => {
          const old = prev[sym];
          const flash: Ticker["flash"] = old
            ? newPrice > old.price ? "up" : newPrice < old.price ? "down" : null
            : null;

          if (flash) {
            if (flashTimers.current[sym]) clearTimeout(flashTimers.current[sym]);
            flashTimers.current[sym] = setTimeout(() => {
              if (!mountedRef.current) return;
              setTickers((p) => p[sym] ? { ...p, [sym]: { ...p[sym], flash: null } } : p);
            }, 600);
          }

          return {
            ...prev,
            [sym]: {
              price: newPrice,
              changePct: parseFloat(d.P),
              high: parseFloat(d.h),
              low: parseFloat(d.l),
              volUsdt: parseFloat(d.q),
              flash,
            },
          };
        });
      } catch { /* ignore malformed */ }
    };

    ws.onerror = () => { if (mountedRef.current) setWsStatus("error"); };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setWsStatus("connecting");
      reconnectTimer.current = setTimeout(connect, 3000);
    };
  }, []);

  // ── Fiat rates ─────────────────────────────────────────────────────────────

  const fetchFiat = useCallback(async () => {
    try {
      const r = await fetch(
        `https://api.frankfurter.app/latest?from=USD&to=${FIAT_CODES.join(",")}`
      );
      if (!r.ok) return;
      const json = await r.json();
      if (mountedRef.current) {
        setFiatRates(json.rates ?? {});
        fiatFetchedAt.current = Date.now();
        setFiatAge(0);
      }
    } catch { /* network error, ignore */ }
  }, []);

  // ── Mount / unmount ────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    connect();
    fetchFiat();

    fiatTimer.current = setInterval(fetchFiat, 60_000);
    fiatAgeTimer.current = setInterval(() => {
      if (fiatFetchedAt.current) {
        setFiatAge(Math.floor((Date.now() - fiatFetchedAt.current) / 1000));
      }
    }, 5000);

    return () => {
      mountedRef.current = false;
      wsRef.current?.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (fiatTimer.current) clearInterval(fiatTimer.current);
      if (fiatAgeTimer.current) clearInterval(fiatAgeTimer.current);
      Object.values(flashTimers.current).forEach(clearTimeout);
    };
  }, [connect, fetchFiat]);

  // ── Converter logic ────────────────────────────────────────────────────────

  function toUsd(cur: string, amount: number): number {
    if (cur === "USDT" || cur === "USD") return amount;
    const pair = PAIRS.find((p) => p.short === cur);
    if (pair) return amount * (tickers[pair.symbol]?.price ?? 0);
    // fiat: 1 USD = fiatRates[cur] units, so 1 unit = 1/fiatRates[cur] USD
    return fiatRates[cur] ? amount / fiatRates[cur] : 0;
  }

  function fromUsd(cur: string, usd: number): number {
    if (cur === "USDT" || cur === "USD") return usd;
    const pair = PAIRS.find((p) => p.short === cur);
    if (pair) return tickers[pair.symbol]?.price ? usd / tickers[pair.symbol].price : 0;
    return fiatRates[cur] ? usd * fiatRates[cur] : 0;
  }

  const amount = parseFloat(fromAmt.replace(/,/g, "")) || 0;
  const resultUsd = toUsd(fromCur, amount);
  const result = fromUsd(toCur, resultUsd);

  // All available currencies for converter selects
  const ALL_CURRENCIES = [
    "USDT",
    ...PAIRS.map((p) => p.short),
    "USD",
    ...FIAT_CODES,
  ];

  // ── UI ─────────────────────────────────────────────────────────────────────

  return (
    <main className="py-8 px-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold text-white tracking-tight">Market</h1>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                wsStatus === "live" ? "bg-[#50e3c2]" : wsStatus === "error" ? "bg-[#ff4444]" : "bg-[#f5a623]"
              }`}
              style={wsStatus === "live" ? { animation: "pulse 2s infinite" } : undefined}
            />
            <span className="text-[10px] font-mono text-[#555]">
              {wsStatus === "live" ? "LIVE" : wsStatus === "error" ? "ERROR" : "CONNECTING…"}
            </span>
          </div>
        </div>

        {/* Ticker table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1a1a1a] text-[#444]">
                  <th className="text-left px-4 py-2.5 font-mono tracking-widest font-normal">PAIR</th>
                  <th className="text-right px-3 py-2.5 font-mono tracking-widest font-normal">PRICE</th>
                  <th className="text-right px-3 py-2.5 font-mono tracking-widest font-normal">24H %</th>
                  <th className="text-right px-3 py-2.5 font-mono tracking-widest font-normal hidden sm:table-cell">HIGH</th>
                  <th className="text-right px-3 py-2.5 font-mono tracking-widest font-normal hidden sm:table-cell">LOW</th>
                  <th className="text-right px-4 py-2.5 font-mono tracking-widest font-normal hidden md:table-cell">VOL</th>
                </tr>
              </thead>
              <tbody>
                {PAIRS.map((pair) => {
                  const t = tickers[pair.symbol];
                  const up = (t?.changePct ?? 0) >= 0;
                  const flashColor =
                    t?.flash === "up"
                      ? "bg-[#50e3c2]/10"
                      : t?.flash === "down"
                      ? "bg-[#ff4444]/10"
                      : "";
                  return (
                    <tr
                      key={pair.symbol}
                      className={`border-b border-[#0d0d0d] transition-colors duration-300 ${flashColor}`}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{pair.short}</span>
                          <span className="text-[#444] hidden sm:inline">/USDT</span>
                        </div>
                        <p className="text-[10px] text-[#444] hidden sm:block">{pair.name}</p>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {t ? (
                          <span
                            className="font-mono text-white font-medium transition-colors duration-300"
                            style={{ color: t.flash === "up" ? "#50e3c2" : t.flash === "down" ? "#ff4444" : "white" }}
                          >
                            ${fmtPrice(t.price)}
                          </span>
                        ) : (
                          <span className="text-[#333]">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {t ? (
                          <span className={`font-mono font-medium ${up ? "text-[#50e3c2]" : "text-[#ff4444]"}`}>
                            {up ? "+" : ""}{t.changePct.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-[#333]">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#555] hidden sm:table-cell">
                        {t ? `$${fmtPrice(t.high)}` : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#555] hidden sm:table-cell">
                        {t ? `$${fmtPrice(t.low)}` : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-[#444] hidden md:table-cell">
                        {t ? fmtVol(t.volUsdt) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Converter */}
        <div className="card p-5">
          <p className="text-xs font-mono uppercase tracking-widest text-[#555] mb-4">Converter</p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* From */}
            <div className="flex gap-2 flex-1">
              <input
                type="text"
                value={fromAmt}
                onChange={(e) => setFromAmt(e.target.value)}
                className="field flex-1 text-right tabular-nums font-mono"
                placeholder="0"
              />
              <select
                value={fromCur}
                onChange={(e) => setFromCur(e.target.value)}
                className="field w-28 flex-shrink-0"
              >
                {ALL_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Swap */}
            <button
              onClick={() => { setFromCur(toCur); setToCur(fromCur); }}
              className="btn-ghost border border-[#333] px-3 py-2 text-base self-center flex-shrink-0 hover:border-[#555] transition-colors"
              title="Swap currencies"
            >
              ⇄
            </button>

            {/* To */}
            <div className="flex gap-2 flex-1">
              <input
                type="text"
                value={fmtResult(result)}
                readOnly
                className="field flex-1 text-right tabular-nums font-mono bg-transparent text-[#888]"
                placeholder="0"
              />
              <select
                value={toCur}
                onChange={(e) => setToCur(e.target.value)}
                className="field w-28 flex-shrink-0"
              >
                {ALL_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Rate line */}
          <p className="text-[10px] text-[#444] mt-3 tabular-nums">
            {amount > 0 && result > 0
              ? `1 ${fromCur} = ${fmtResult(result / amount)} ${toCur}`
              : wsStatus !== "live"
              ? "Connecting to live data…"
              : "Enter an amount to convert"}
          </p>
        </div>

        {/* Fiat rates strip */}
        {Object.keys(fiatRates).length > 0 && (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-mono uppercase tracking-widest text-[#555]">Fiat Rates (per USD)</p>
              {fiatAge !== null && (
                <p className="text-[10px] text-[#333] font-mono">
                  {fiatAge < 60 ? "just now" : `${Math.floor(fiatAge / 60)}m ago`}
                </p>
              )}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {FIAT_CODES.filter((c) => fiatRates[c]).map((c) => (
                <div key={c} className="flex flex-col">
                  <span className="text-[9px] font-mono text-[#444] uppercase">{c}</span>
                  <span className="text-xs font-mono text-[#888] tabular-nums">
                    {fiatRates[c].toLocaleString("en-US", { maximumFractionDigits: 4, minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
