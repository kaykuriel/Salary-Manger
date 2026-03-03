"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Config ──────────────────────────────────────────────────────────────────

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

const FIAT_CODES = ["BRL", "EUR", "GBP", "JPY", "CAD", "CHF", "AUD", "HKD", "MXN", "CNY"];

// Port 443 works through most firewalls; 9443 is often blocked
const WS_URL =
  "wss://stream.binance.com:443/stream?streams=" +
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

// Handles BR format ("1.500,75") and US format ("1,500.75") correctly
function parseAmount(s: string): number {
  const t = s.trim();
  if (!t) return 0;
  const lastComma = t.lastIndexOf(",");
  const lastDot = t.lastIndexOf(".");
  if (lastComma > lastDot) {
    // BR: comma is decimal separator
    return parseFloat(t.replace(/\./g, "").replace(",", ".")) || 0;
  }
  // US: dot is decimal separator
  return parseFloat(t.replace(/,/g, "")) || 0;
}

function fmtPrice(v: number): string {
  if (v >= 10000)
    return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (v >= 1)
    return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return v.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 6 });
}

function fmtVol(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  return `$${(v / 1e3).toFixed(1)}K`;
}

function fmtResult(v: number): string {
  if (v === 0) return "0";
  if (v >= 1e6) return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (v >= 1) return v.toLocaleString("en-US", { maximumFractionDigits: 6 });
  return v.toFixed(10).replace(/\.?0+$/, "");
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CurrencyConverter() {
  const [tickers, setTickers] = useState<Record<string, Ticker>>({});
  const [fiatRates, setFiatRates] = useState<Record<string, number>>({});
  const [wsStatus, setWsStatus] = useState<"connecting" | "live" | "error">("connecting");
  const [fiatAge, setFiatAge] = useState<number | null>(null);

  const [fromAmt, setFromAmt] = useState("1");
  const [fromCur, setFromCur] = useState("BTC");
  const [toCur, setToCur] = useState("BRL");

  const wsRef = useRef<WebSocket | null>(null);
  const flashTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fiatTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const fiatAgeTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const restPollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const fiatFetchedAt = useRef<number | null>(null);
  const wsLiveRef = useRef(false);

  // ── REST prices (immediate warm-up + fallback when WS is down) ─────────────

  const fetchRestPrices = useCallback(async () => {
    try {
      const symbols = encodeURIComponent(JSON.stringify(PAIRS.map((p) => p.symbol)));
      const r = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbols=${symbols}`
      );
      if (!r.ok || !mountedRef.current) return;
      const arr: Array<Record<string, string>> = await r.json();
      setTickers((prev) => {
        const next = { ...prev };
        for (const d of arr) {
          // Only fill in if WS hasn't provided fresh data for this symbol
          if (!next[d.symbol]) {
            next[d.symbol] = {
              price: parseFloat(d.lastPrice),
              changePct: parseFloat(d.priceChangePercent),
              high: parseFloat(d.highPrice),
              low: parseFloat(d.lowPrice),
              volUsdt: parseFloat(d.quoteVolume),
              flash: null,
            };
          }
        }
        return next;
      });
    } catch {
      /* ignore */
    }
  }, []);

  // ── WebSocket ──────────────────────────────────────────────────────────────

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    setWsStatus("connecting");
    wsLiveRef.current = false;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setWsStatus("live");
      wsLiveRef.current = true;
      // Stop REST polling now that WS is live
      if (restPollTimer.current) {
        clearInterval(restPollTimer.current);
        restPollTimer.current = null;
      }
    };

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
            ? newPrice > old.price
              ? "up"
              : newPrice < old.price
              ? "down"
              : null
            : null;

          if (flash) {
            if (flashTimers.current[sym]) clearTimeout(flashTimers.current[sym]);
            flashTimers.current[sym] = setTimeout(() => {
              if (!mountedRef.current) return;
              setTickers((p) =>
                p[sym] ? { ...p, [sym]: { ...p[sym], flash: null } } : p
              );
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
      } catch {
        /* ignore malformed */
      }
    };

    ws.onerror = () => {
      if (mountedRef.current) {
        setWsStatus("error");
        wsLiveRef.current = false;
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setWsStatus("connecting");
      wsLiveRef.current = false;
      reconnectTimer.current = setTimeout(connect, 5000);
    };
  }, []);

  // ── Fiat rates ─────────────────────────────────────────────────────────────

  const fetchFiat = useCallback(async () => {
    try {
      const r = await fetch(
        `https://api.frankfurter.app/latest?from=USD&to=${FIAT_CODES.join(",")}`
      );
      if (!r.ok || !mountedRef.current) return;
      const json = await r.json();
      setFiatRates(json.rates ?? {});
      fiatFetchedAt.current = Date.now();
      setFiatAge(0);
    } catch {
      /* ignore */
    }
  }, []);

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;

    // Fetch REST prices immediately so converter works right away
    fetchRestPrices();
    // Start WS for real-time updates
    connect();
    fetchFiat();

    fiatTimer.current = setInterval(fetchFiat, 60_000);
    fiatAgeTimer.current = setInterval(() => {
      if (fiatFetchedAt.current)
        setFiatAge(Math.floor((Date.now() - fiatFetchedAt.current) / 1000));
    }, 5_000);

    // REST fallback every 15s when WS is blocked/down
    restPollTimer.current = setInterval(() => {
      if (!wsLiveRef.current) fetchRestPrices();
    }, 15_000);

    return () => {
      mountedRef.current = false;
      wsRef.current?.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (fiatTimer.current) clearInterval(fiatTimer.current);
      if (fiatAgeTimer.current) clearInterval(fiatAgeTimer.current);
      if (restPollTimer.current) clearInterval(restPollTimer.current);
      Object.values(flashTimers.current).forEach(clearTimeout);
    };
  }, [connect, fetchFiat, fetchRestPrices]);

  // ── Converter logic ────────────────────────────────────────────────────────

  function toUsd(cur: string, amount: number): number {
    if (cur === "USDT" || cur === "USD") return amount;
    const pair = PAIRS.find((p) => p.short === cur);
    if (pair) return amount * (tickers[pair.symbol]?.price ?? 0);
    return fiatRates[cur] ? amount / fiatRates[cur] : 0;
  }

  function fromUsd(cur: string, usd: number): number {
    if (cur === "USDT" || cur === "USD") return usd;
    const pair = PAIRS.find((p) => p.short === cur);
    if (pair) {
      const p = tickers[pair.symbol]?.price;
      return p ? usd / p : 0;
    }
    return fiatRates[cur] ? usd * fiatRates[cur] : 0;
  }

  function hasData(cur: string): boolean {
    if (cur === "USDT" || cur === "USD") return true;
    const pair = PAIRS.find((p) => p.short === cur);
    if (pair) return !!(tickers[pair.symbol]?.price);
    return !!fiatRates[cur];
  }

  const amount = parseAmount(fromAmt);
  const canConvert = hasData(fromCur) && hasData(toCur);
  const resultUsd = toUsd(fromCur, amount);
  const result = fromUsd(toCur, resultUsd);
  const ratePerUnit = fromUsd(toCur, toUsd(fromCur, 1));

  const ALL_CURRENCIES = ["USDT", ...PAIRS.map((p) => p.short), "USD", ...FIAT_CODES];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="py-8 px-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold text-white tracking-tight">Market</h1>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                wsStatus === "live"
                  ? "bg-[#50e3c2]"
                  : wsStatus === "error"
                  ? "bg-[#ff4444]"
                  : "bg-[#f5a623]"
              }`}
              style={wsStatus === "live" ? { animation: "pulse 2s infinite" } : undefined}
            />
            <span className="text-[10px] font-mono text-[#555]">
              {wsStatus === "live"
                ? "LIVE"
                : wsStatus === "error"
                ? "RECONNECTING"
                : "CONNECTING…"}
            </span>
          </div>
        </div>

        {/* ── Converter — at top for quick access ────────────────────────── */}
        <div className="card p-5">
          <p className="text-xs font-mono uppercase tracking-widest text-[#555] mb-4">
            Converter
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* From */}
            <div className="flex gap-2 flex-1 min-w-0">
              <input
                type="text"
                inputMode="decimal"
                value={fromAmt}
                onChange={(e) => setFromAmt(e.target.value)}
                className="field flex-1 text-right tabular-nums font-mono min-w-0"
                placeholder="0"
              />
              <select
                value={fromCur}
                onChange={(e) => setFromCur(e.target.value)}
                className="field w-24 flex-shrink-0"
              >
                {ALL_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap */}
            <button
              onClick={() => {
                setFromCur(toCur);
                setToCur(fromCur);
              }}
              className="btn-ghost border border-[#333] px-3 py-2 text-base self-center flex-shrink-0 hover:border-[#555] transition-colors"
              title="Swap currencies"
            >
              ⇄
            </button>

            {/* To — read-only result */}
            <div className="flex gap-2 flex-1 min-w-0">
              <div className="field flex-1 flex items-center justify-end font-mono min-w-0">
                {amount > 0 ? (
                  !canConvert ? (
                    <span className="text-[#555] text-xs">loading…</span>
                  ) : result > 0 ? (
                    <span className="tabular-nums text-white">{fmtResult(result)}</span>
                  ) : (
                    <span className="text-[#444]">—</span>
                  )
                ) : (
                  <span className="text-[#444]">—</span>
                )}
              </div>
              <select
                value={toCur}
                onChange={(e) => setToCur(e.target.value)}
                className="field w-24 flex-shrink-0"
              >
                {ALL_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Rate line */}
          <p className="text-[10px] font-mono text-[#444] mt-3 tabular-nums min-h-[14px]">
            {canConvert && ratePerUnit > 0
              ? `1 ${fromCur} = ${fmtResult(ratePerUnit)} ${toCur}`
              : !canConvert && amount > 0
              ? "Waiting for price data…"
              : ""}
          </p>
        </div>

        {/* ── Ticker table ───────────────────────────────────────────────── */}
        <div className="card overflow-hidden">
          <div className="px-4 py-2 border-b border-[#111]">
            <p className="text-[9px] font-mono uppercase tracking-widest text-[#333]">
              Click a row to use in converter
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1a1a1a]">
                  <th className="text-left px-4 py-2 text-[#444] font-mono tracking-widest font-normal">
                    PAIR
                  </th>
                  <th className="text-right px-3 py-2 text-[#444] font-mono tracking-widest font-normal">
                    PRICE
                  </th>
                  <th className="text-right px-3 py-2 text-[#444] font-mono tracking-widest font-normal">
                    24H %
                  </th>
                  <th className="text-right px-3 py-2 text-[#444] font-mono tracking-widest font-normal hidden sm:table-cell">
                    HIGH
                  </th>
                  <th className="text-right px-3 py-2 text-[#444] font-mono tracking-widest font-normal hidden sm:table-cell">
                    LOW
                  </th>
                  <th className="text-right px-4 py-2 text-[#444] font-mono tracking-widest font-normal hidden md:table-cell">
                    VOL
                  </th>
                </tr>
              </thead>
              <tbody>
                {PAIRS.map((pair) => {
                  const t = tickers[pair.symbol];
                  const up = (t?.changePct ?? 0) >= 0;
                  const isSelected = fromCur === pair.short;
                  const flashBg =
                    t?.flash === "up"
                      ? "bg-[#50e3c2]/10"
                      : t?.flash === "down"
                      ? "bg-[#ff4444]/10"
                      : "";
                  return (
                    <tr
                      key={pair.symbol}
                      onClick={() => setFromCur(pair.short)}
                      className={`border-b border-[#0d0d0d] cursor-pointer transition-colors duration-300
                        hover:bg-white/[0.03] ${isSelected ? "bg-white/[0.05]" : ""} ${flashBg}`}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <span className="w-1 h-1 rounded-full bg-[#cc0000] flex-shrink-0" />
                          )}
                          <span className="font-semibold text-white">{pair.short}</span>
                          <span className="text-[#333] hidden sm:inline">/USDT</span>
                        </div>
                        <p className="text-[9px] text-[#444] hidden sm:block mt-0.5">
                          {pair.name}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {t ? (
                          <span
                            className="font-mono font-medium transition-colors duration-300"
                            style={{
                              color:
                                t.flash === "up"
                                  ? "#50e3c2"
                                  : t.flash === "down"
                                  ? "#ff4444"
                                  : "white",
                            }}
                          >
                            ${fmtPrice(t.price)}
                          </span>
                        ) : (
                          <span className="text-[#333]">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {t ? (
                          <span
                            className={`font-mono font-medium ${
                              up ? "text-[#50e3c2]" : "text-[#ff4444]"
                            }`}
                          >
                            {up ? "+" : ""}
                            {t.changePct.toFixed(2)}%
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

        {/* ── Fiat rates ─────────────────────────────────────────────────── */}
        {Object.keys(fiatRates).length > 0 && (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#555]">
                Fiat (per 1 USD)
              </p>
              <button
                onClick={fetchFiat}
                className="text-[10px] text-[#333] font-mono hover:text-[#666] transition-colors"
                title="Refresh fiat rates"
              >
                {fiatAge !== null
                  ? fiatAge < 60
                    ? "just now"
                    : `${Math.floor(fiatAge / 60)}m ago`
                  : ""}{" "}
                ↻
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {FIAT_CODES.filter((c) => fiatRates[c]).map((c) => (
                <button
                  key={c}
                  onClick={() => setToCur(c)}
                  className={`flex flex-col text-left rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.04] ${
                    toCur === c ? "bg-white/[0.07] ring-1 ring-white/10" : ""
                  }`}
                >
                  <span className="text-[9px] font-mono text-[#444] uppercase tracking-wide">
                    {c}
                  </span>
                  <span className="text-xs font-mono text-[#888] tabular-nums">
                    {fiatRates[c].toLocaleString("en-US", {
                      maximumFractionDigits: 4,
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
