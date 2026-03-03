"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Goal = {
  id: string;
  name: string;
  target: number;
  current: number;
  color: string;
  icon: string;
};

// ─── Emoji data (WhatsApp-style categories) ───────────────────────────────────

type EmojiItem = { e: string; k: string };
type EmojiCat = { id: string; icon: string; name: string; items: EmojiItem[] };

const EMOJI_CATS: EmojiCat[] = [
  {
    id: "goals", icon: "🏆", name: "Metas",
    items: [
      { e: "🎯", k: "alvo meta objetivo" }, { e: "🏆", k: "trofeu premio ganhar" },
      { e: "🥇", k: "ouro primeiro lugar" }, { e: "🏅", k: "medalha" },
      { e: "⭐", k: "estrela" },             { e: "🌟", k: "estrela brilhante" },
      { e: "✨", k: "brilho sparkle" },       { e: "💫", k: "estrela cadente" },
      { e: "🔥", k: "fogo fire" },           { e: "💪", k: "musculo forte" },
      { e: "🎖️", k: "medalha militar" },     { e: "🏁", k: "largada chegada" },
      { e: "⚡", k: "raio energia" },         { e: "🚩", k: "bandeira flag" },
      { e: "🌈", k: "arco iris" },           { e: "🎗️", k: "fita laco" },
    ],
  },
  {
    id: "travel", icon: "✈️", name: "Viagem",
    items: [
      { e: "✈️", k: "aviao voo viagem" },   { e: "🚀", k: "foguete espaco" },
      { e: "🚂", k: "trem locomotiva" },     { e: "🚗", k: "carro auto" },
      { e: "🛳️", k: "navio cruzeiro" },     { e: "🏖️", k: "praia areia" },
      { e: "🏔️", k: "montanha neve" },      { e: "🌴", k: "palmeira tropical" },
      { e: "🗺️", k: "mapa" },               { e: "🗼", k: "torre paris" },
      { e: "🏝️", k: "ilha" },               { e: "⛺", k: "barraca camping" },
      { e: "🧳", k: "mala bagagem" },        { e: "🌍", k: "mundo mundo" },
      { e: "🎡", k: "roda gigante parque" }, { e: "🏕️", k: "acampamento floresta" },
    ],
  },
  {
    id: "tech", icon: "💻", name: "Tech",
    items: [
      { e: "💻", k: "notebook computador laptop" }, { e: "📱", k: "celular smartphone" },
      { e: "⌚", k: "relogio smartwatch" },          { e: "📷", k: "camera foto" },
      { e: "🎮", k: "videogame controle" },          { e: "🖥️", k: "monitor desktop" },
      { e: "🎧", k: "fone ouvido musica" },          { e: "📺", k: "televisao tv" },
      { e: "🕹️", k: "joystick arcade" },            { e: "📡", k: "antena satelite" },
      { e: "🔭", k: "telescopio" },                  { e: "🔬", k: "microscopio ciencia" },
      { e: "🖨️", k: "impressora" },                 { e: "💾", k: "disquete dados" },
      { e: "🎙️", k: "microfone" },                  { e: "🤖", k: "robo ia" },
    ],
  },
  {
    id: "home", icon: "🏠", name: "Casa",
    items: [
      { e: "🏠", k: "casa lar" },     { e: "🏡", k: "casinha jardim" },
      { e: "🏢", k: "predio ap" },    { e: "🛋️", k: "sofa sala" },
      { e: "🪑", k: "cadeira" },      { e: "🛏️", k: "cama quarto" },
      { e: "🚿", k: "chuveiro" },     { e: "🪴", k: "planta vaso" },
      { e: "🔑", k: "chave" },        { e: "🏗️", k: "construcao obra" },
      { e: "🪟", k: "janela" },       { e: "🛁", k: "banheira" },
      { e: "🧹", k: "vassoura" },     { e: "🪞", k: "espelho" },
      { e: "🛠️", k: "ferramenta" },  { e: "🏘️", k: "casas bairro" },
    ],
  },
  {
    id: "money", icon: "💰", name: "Dinheiro",
    items: [
      { e: "💰", k: "dinheiro grana" }, { e: "💵", k: "dolar nota" },
      { e: "💶", k: "euro nota" },      { e: "💷", k: "libra nota" },
      { e: "💸", k: "dinheiro gastando" }, { e: "💳", k: "cartao credito" },
      { e: "🏦", k: "banco financeiro" }, { e: "💎", k: "diamante precioso" },
      { e: "👑", k: "coroa rei" },       { e: "🪙", k: "moeda" },
      { e: "💹", k: "grafico mercado" }, { e: "📈", k: "grafico subindo" },
      { e: "💼", k: "maleta trabalho" }, { e: "🤑", k: "rico dinheiro" },
      { e: "🏧", k: "caixa eletronico" }, { e: "📊", k: "grafico barras" },
    ],
  },
  {
    id: "food", icon: "🍕", name: "Comida",
    items: [
      { e: "🍕", k: "pizza" },        { e: "🍜", k: "macarrao ramen" },
      { e: "☕", k: "cafe" },          { e: "🍷", k: "vinho taca" },
      { e: "🥂", k: "champanhe" },    { e: "🍰", k: "bolo fatia" },
      { e: "🎂", k: "bolo aniversario" }, { e: "🍣", k: "sushi japones" },
      { e: "🍔", k: "hamburguer" },   { e: "🥃", k: "whisky drink" },
      { e: "🍩", k: "donuts" },       { e: "🧁", k: "cupcake" },
      { e: "🍫", k: "chocolate" },    { e: "🍺", k: "cerveja" },
      { e: "🥗", k: "salada" },       { e: "🌮", k: "taco mexicano" },
    ],
  },
  {
    id: "fitness", icon: "🏋️", name: "Esporte",
    items: [
      { e: "🏋️", k: "academia musculacao" }, { e: "🚴", k: "bicicleta ciclismo" },
      { e: "🧘", k: "yoga meditacao" },       { e: "🏊", k: "natacao piscina" },
      { e: "🏃", k: "corrida correr" },       { e: "⚽", k: "futebol bola" },
      { e: "🎾", k: "tenis" },                { e: "🏀", k: "basquete" },
      { e: "🏄", k: "surf" },                 { e: "🧗", k: "escalada" },
      { e: "🥊", k: "boxe luva" },            { e: "⛷️", k: "esqui neve" },
      { e: "🎿", k: "ski esqui" },            { e: "🏇", k: "hipismo cavalo" },
      { e: "🤸", k: "ginastica" },            { e: "🏸", k: "badminton" },
    ],
  },
  {
    id: "education", icon: "🎓", name: "Educação",
    items: [
      { e: "🎓", k: "formatura diploma" }, { e: "📚", k: "livros estudo" },
      { e: "📖", k: "livro leitura" },     { e: "✏️", k: "lapis escrever" },
      { e: "📝", k: "caderno nota" },      { e: "🎨", k: "arte pintura" },
      { e: "🎭", k: "teatro arte" },       { e: "🎵", k: "musica nota" },
      { e: "🎸", k: "guitarra musica" },   { e: "🎹", k: "piano musica" },
      { e: "🏛️", k: "museu historia" },   { e: "🧪", k: "laboratorio quimica" },
      { e: "📐", k: "regua matematica" },  { e: "🖊️", k: "caneta escrita" },
      { e: "🗣️", k: "idioma falar" },     { e: "💡", k: "ideia conhecimento" },
    ],
  },
  {
    id: "fashion", icon: "👗", name: "Moda",
    items: [
      { e: "👗", k: "vestido roupa" }, { e: "👠", k: "sapato salto" },
      { e: "👜", k: "bolsa" },         { e: "💍", k: "anel joias" },
      { e: "💄", k: "batom maquiagem" }, { e: "👒", k: "chapeu" },
      { e: "🕶️", k: "oculos sol" },   { e: "💅", k: "unha esmalte" },
      { e: "👟", k: "tenis" },         { e: "🎩", k: "cartola chapeu" },
      { e: "🧣", k: "cachecol" },      { e: "🧥", k: "casaco" },
      { e: "👔", k: "camisa social" }, { e: "🛍️", k: "sacola compras" },
      { e: "👓", k: "oculos grau" },   { e: "🧤", k: "luva" },
    ],
  },
];

const ALL_EMOJI_ITEMS = EMOJI_CATS.flatMap((c) => c.items);

// ─── Color options ────────────────────────────────────────────────────────────

const COLOR_OPTIONS = [
  { name: "Vermelho",   hex: "#cc0000" },
  { name: "Tomate",     hex: "#e53e3e" },
  { name: "Coral",      hex: "#ff6b6b" },
  { name: "Laranja",    hex: "#ff6600" },
  { name: "Âmbar",      hex: "#f5a623" },
  { name: "Ouro",       hex: "#ffd700" },
  { name: "Lima",       hex: "#a8e63d" },
  { name: "Verde",      hex: "#06d6a0" },
  { name: "Esmeralda",  hex: "#2ecc71" },
  { name: "Turquesa",   hex: "#50e3c2" },
  { name: "Ciano",      hex: "#00b4d8" },
  { name: "Azul",       hex: "#0070f3" },
  { name: "Royal",      hex: "#4169e1" },
  { name: "Índigo",     hex: "#6610f2" },
  { name: "Roxo",       hex: "#7928ca" },
  { name: "Violeta",    hex: "#9b59b6" },
  { name: "Rosa",       hex: "#ff0080" },
  { name: "Magenta",    hex: "#e91e63" },
  { name: "Prata",      hex: "#9e9e9e" },
  { name: "Branco",     hex: "#e0e0e0" },
];

// ─── Utility ─────────────────────────────────────────────────────────────────

function parseMoney(s: string): number {
  const t = s.trim();
  if (!t) return 0;
  const lastComma = t.lastIndexOf(",");
  const lastDot = t.lastIndexOf(".");
  if (lastComma > lastDot) return parseFloat(t.replace(/\./g, "").replace(",", ".")) || 0;
  return parseFloat(t.replace(/,/g, "")) || 0;
}

function fmt(v: number): string {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── EmojiPicker ─────────────────────────────────────────────────────────────

function EmojiPicker({
  value,
  onChange,
  align = "left",
}: {
  value: string;
  onChange: (e: string) => void;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("goals");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = search.trim()
    ? ALL_EMOJI_ITEMS.filter(
        (item) =>
          item.k.toLowerCase().includes(search.toLowerCase()) || item.e === search
      )
    : (EMOJI_CATS.find((c) => c.id === activeCat)?.items ?? []);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-11 h-11 text-2xl flex items-center justify-center rounded-xl border transition-colors ${
          open
            ? "border-[#cc0000]/50 bg-[#cc0000]/5"
            : "border-[#222] hover:border-[#444] bg-[#0a0a0a]"
        }`}
        title="Escolher ícone"
      >
        {value}
      </button>

      {open && (
        <div
          className={`absolute top-full mt-2 w-72 bg-[#0d0d0d] border border-[#222] rounded-xl shadow-2xl shadow-black/90 z-[100] overflow-hidden ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {/* Search */}
          <div className="p-2 border-b border-[#1a1a1a]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar emoji…"
              className="field w-full text-sm"
              autoFocus
            />
          </div>

          {/* Category tabs */}
          {!search && (
            <div className="flex border-b border-[#1a1a1a] overflow-x-auto px-1 scrollbar-hide">
              {EMOJI_CATS.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCat(cat.id)}
                  title={cat.name}
                  className={`flex-shrink-0 text-xl px-2 py-2 transition-all relative ${
                    activeCat === cat.id
                      ? "opacity-100"
                      : "opacity-35 hover:opacity-60"
                  }`}
                >
                  {cat.icon}
                  {activeCat === cat.id && (
                    <span className="absolute bottom-0 left-1 right-1 h-0.5 bg-[#cc0000] rounded-full" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Category label */}
          {!search && (
            <p className="text-[9px] font-mono uppercase tracking-widest text-[#333] px-3 pt-2 pb-0">
              {EMOJI_CATS.find((c) => c.id === activeCat)?.name}
            </p>
          )}

          {/* Emoji grid */}
          <div className="grid grid-cols-8 p-2 max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="col-span-8 text-[#555] text-xs text-center py-4">
                Nenhum resultado
              </p>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.e + item.k}
                  type="button"
                  onClick={() => {
                    onChange(item.e);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`text-xl w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:bg-white/10 hover:scale-110 ${
                    value === item.e ? "bg-white/10 ring-1 ring-white/20" : ""
                  }`}
                >
                  {item.e}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ColorPicker ─────────────────────────────────────────────────────────────

function ColorPicker({
  value,
  onChange,
  align = "left",
}: {
  value: string;
  onChange: (c: string) => void;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = COLOR_OPTIONS.find((c) => c.hex === value) ?? COLOR_OPTIONS[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`field flex items-center gap-2.5 px-3 py-2 w-36 transition-colors ${
          open ? "border-[#cc0000]/50" : ""
        }`}
      >
        <span
          className="w-3.5 h-3.5 rounded-full flex-shrink-0 ring-1 ring-white/10"
          style={{ backgroundColor: value }}
        />
        <span className="text-sm text-[#888] flex-1 text-left truncate">
          {selected.name}
        </span>
        <span className="text-[#444] text-[10px] flex-shrink-0">▾</span>
      </button>

      {open && (
        <div
          className={`absolute top-full mt-1 w-44 bg-[#0d0d0d] border border-[#222] rounded-xl shadow-2xl shadow-black/80 z-[100] py-1 max-h-64 overflow-y-auto ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => {
                onChange(c.hex);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                value === c.hex
                  ? "bg-white/[0.07] text-white"
                  : "text-[#888] hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <span
                className="w-3.5 h-3.5 rounded-full flex-shrink-0 ring-1 ring-white/10"
                style={{ backgroundColor: c.hex }}
              />
              {c.name}
              {value === c.hex && (
                <span className="ml-auto text-[#cc0000] text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── RingChart ───────────────────────────────────────────────────────────────

function RingChart({ pct, color, size = 52 }: { pct: number; color: string; size?: number }) {
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
        cx={cx} cy={cx} r={r} fill="none"
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

// ─── GoalCard ────────────────────────────────────────────────────────────────

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
  const [showCustomize, setShowCustomize] = useState(false);

  const icon = goal.icon || "🎯";
  const pct = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
  const done = pct >= 100;
  const remaining = Math.max(0, goal.target - goal.current);

  function startEdit(field: "name" | "current" | "target") {
    const val =
      field === "name"
        ? goal.name
        : field === "current"
        ? goal.current > 0 ? String(goal.current) : ""
        : goal.target > 0 ? String(goal.target) : "";
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

        <div className="flex-1 min-w-0">
          {/* Name + actions */}
          <div className="flex items-start justify-between gap-2 mb-1">
            {editField === "name" ? (
              <input
                autoFocus
                className="field text-sm flex-1 py-0.5 h-7"
                value={editRaw}
                onChange={(e) => setEditRaw(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit("name", editRaw);
                  if (e.key === "Escape") { setEditField(""); setEditRaw(""); }
                }}
                onBlur={() => saveEdit("name", editRaw)}
              />
            ) : (
              <button
                onClick={() => startEdit("name")}
                className="text-sm font-medium text-white hover:text-[#bbb] text-left truncate transition-colors"
                title="Clique para renomear"
              >
                {goal.name}
              </button>
            )}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setShowCustomize((v) => !v)}
                className={`w-5 h-5 flex items-center justify-center rounded text-[10px] transition-colors ${
                  showCustomize ? "text-white bg-white/10" : "text-[#333] hover:text-[#888]"
                }`}
                title="Personalizar"
              >
                🎨
              </button>
              <button
                onClick={() => onDelete(goal.id)}
                className="text-[#333] hover:text-[#ff4444] transition-colors w-5 h-5 flex items-center justify-center rounded text-xs"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Customize row */}
          {showCustomize && (
            <div className="flex items-center gap-2 mb-3 p-2 bg-[#0d0d0d] rounded-lg border border-[#1a1a1a]">
              <EmojiPicker
                value={icon}
                onChange={(e) => { onUpdate({ ...goal, icon: e }); }}
                align="left"
              />
              <ColorPicker
                value={goal.color}
                onChange={(c) => onUpdate({ ...goal, color: c })}
                align="left"
              />
            </div>
          )}

          {/* Amounts */}
          <div className="flex items-baseline gap-1.5 mb-2 flex-wrap">
            {editField === "current" ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  type="text"
                  inputMode="decimal"
                  value={editRaw}
                  onChange={(e) => setEditRaw(e.target.value)}
                  placeholder="0,00"
                  className="bg-transparent text-xs text-white border-b border-[#cc0000] outline-none w-28 tabular-nums font-mono"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit("current", editRaw);
                    if (e.key === "Escape") { setEditField(""); setEditRaw(""); }
                  }}
                />
                <button
                  onClick={() => saveEdit("current", editRaw)}
                  className="text-[10px] text-[#50e3c2] hover:text-white transition-colors px-1"
                >✓</button>
                <button
                  onClick={() => { setEditField(""); setEditRaw(""); }}
                  className="text-[10px] text-[#555] hover:text-white transition-colors px-1"
                >✕</button>
              </div>
            ) : (
              <button
                onClick={() => startEdit("current")}
                className="text-xs tabular-nums font-mono transition-colors hover:text-white"
                style={{ color: done ? "#50e3c2" : "#888" }}
                title="Clique para editar valor salvo"
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
                  placeholder="0,00"
                  className="bg-transparent text-xs text-[#555] border-b border-[#444] outline-none w-28 tabular-nums font-mono"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit("target", editRaw);
                    if (e.key === "Escape") { setEditField(""); setEditRaw(""); }
                  }}
                />
                <button
                  onClick={() => saveEdit("target", editRaw)}
                  className="text-[10px] text-[#50e3c2] hover:text-white transition-colors px-1"
                >✓</button>
                <button
                  onClick={() => { setEditField(""); setEditRaw(""); }}
                  className="text-[10px] text-[#555] hover:text-white transition-colors px-1"
                >✕</button>
              </div>
            ) : (
              <button
                onClick={() => startEdit("target")}
                className="text-xs text-[#555] hover:text-[#888] transition-colors tabular-nums font-mono"
                title="Clique para editar meta"
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
            <p className="text-[10px] text-[#50e3c2] font-mono mb-3">Meta atingida!</p>
          ) : (
            <p className="text-[10px] text-[#444] mb-3 tabular-nums">
              R${fmt(remaining)} restante
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
                    + Adicionar
                  </button>
                  <button
                    onClick={() => setFundsMode("withdraw")}
                    className={`text-[10px] px-2.5 py-1 rounded-md transition-all ${
                      fundsMode === "withdraw"
                        ? "text-white border border-[#555] bg-[#222]"
                        : "text-[#555] border border-transparent hover:text-[#888]"
                    }`}
                  >
                    − Retirar
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
                      if (e.key === "Escape") { setShowFunds(false); setFundsRaw(""); }
                    }}
                  />
                  <button onClick={applyFunds} className="btn text-xs px-3">OK</button>
                  <button
                    onClick={() => { setShowFunds(false); setFundsRaw(""); }}
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
                + Adicionar fundos
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

// ─── GoalsManager ─────────────────────────────────────────────────────────────

export default function GoalsManager() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState(false);
  const [name, setName] = useState("");
  const [targetRaw, setTargetRaw] = useState("");
  const [color, setColor] = useState(COLOR_OPTIONS[0].hex);
  const [icon, setIcon] = useState("🎯");

  const load = useCallback(() => {
    fetch("/api/goals")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { setGoals(d?.goals ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

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
  const overallPct = totalTarget > 0 ? Math.min((totalCurrent / totalTarget) * 100, 100) : 0;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <span className="text-[#555] text-sm">Carregando…</span>
      </main>
    );
  }

  return (
    <main className="py-8 px-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold text-white tracking-tight">Metas Financeiras</h1>
          <span
            className={`text-[10px] font-mono transition-opacity duration-300 ${
              saving ? "text-[#555] opacity-100" : saveErr ? "text-[#ff4444] opacity-100" : "opacity-0"
            }`}
          >
            {saveErr ? "erro ao salvar" : "salvando…"}
          </span>
        </div>

        {/* Overview — 2+ goals */}
        {goals.length > 1 && (
          <div className="card p-4 flex gap-4 items-center">
            {/* Large ring */}
            <div className="relative flex-shrink-0" style={{ width: 72, height: 72 }}>
              <RingChart pct={overallPct} color="#cc0000" size={72} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-mono font-bold text-white leading-none">
                  {overallPct.toFixed(0)}%
                </span>
                <span className="text-[9px] text-[#444] mt-0.5">total</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {/* Segmented bar */}
              <div className="flex h-2 rounded-full overflow-hidden gap-[2px] mb-2">
                {goals.map((g) => {
                  const segW = totalTarget > 0 ? (g.target / totalTarget) * 100 : 100 / goals.length;
                  const fillPct = g.target > 0 ? Math.min(g.current / g.target, 1) * 100 : 0;
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
                <span className="text-[10px] text-[#555] tabular-nums font-mono">R${fmt(totalCurrent)} salvo</span>
                <span className="text-[10px] text-[#444] tabular-nums font-mono">R${fmt(totalTarget)} total</span>
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {goals.map((g) => (
                  <div key={g.id} className="flex items-center gap-1">
                    <span className="text-xs">{g.icon || "🎯"}</span>
                    <span className="text-[9px] text-[#555] truncate max-w-[72px]">{g.name}</span>
                    <span className="text-[9px] font-mono tabular-nums" style={{ color: g.color }}>
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
            <p className="text-[#555] text-sm">Nenhuma meta ainda.</p>
            <p className="text-[#444] text-xs">Crie uma meta abaixo para começar a acompanhar.</p>
          </div>
        )}

        {/* Goal cards */}
        {goals.map((g) => (
          <GoalCard key={g.id} goal={g} onUpdate={handleUpdate} onDelete={handleDelete} />
        ))}

        {/* ── Add goal form ──────────────────────────────────────────── */}
        <div className="card p-5">
          <p className="text-xs font-mono uppercase tracking-widest text-[#666] mb-4">Nova Meta</p>
          <form onSubmit={handleAdd} className="flex flex-col gap-4">

            {/* Name + emoji picker */}
            <div className="flex gap-2 items-center">
              <EmojiPicker value={icon} onChange={setIcon} align="left" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome da meta (ex: viagem, notebook…)"
                className="field flex-1"
              />
            </div>

            {/* Target + color */}
            <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
              <div className="relative flex-1 min-w-0">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] text-sm pointer-events-none">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={targetRaw}
                  onChange={(e) => setTargetRaw(e.target.value)}
                  placeholder="Valor alvo"
                  className="field w-full !pl-9"
                />
              </div>
              <ColorPicker value={color} onChange={setColor} align="right" />
            </div>

            {/* Preview */}
            {name.trim() && (
              <div className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] rounded-lg border border-[#1a1a1a]">
                <span className="text-base">{icon}</span>
                <span className="text-sm text-[#888] flex-1 truncate">{name}</span>
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              </div>
            )}

            <button type="submit" className="btn">Adicionar Meta</button>
          </form>
        </div>

      </div>
    </main>
  );
}
