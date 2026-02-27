"use client";

import { useState, useEffect } from "react";
import { getUsers, deleteUser, createUser, getUserData, resetUserPassword, User } from "@/lib/auth";

function fmt(v: number) {
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Create User Modal ────────────────────────────────────────────────────────

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState<"user" | "admin">("user");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) { setError("All fields required."); return; }
    setLoading(true);
    const res = await createUser(username.trim(), password, role);
    setLoading(false);
    if (!res.ok) { setError(res.error ?? "Failed."); return; }
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-sm bg-[#111] border border-[#333] rounded-xl shadow-2xl">
        <div className="border-b border-[#222] px-5 py-4 flex items-center justify-between">
          <p className="text-sm font-medium text-white">Create user</p>
          <button
            onClick={onClose}
            className="text-[#555] hover:text-white text-xl leading-none transition-colors"
          >
            ×
          </button>
        </div>
        <form onSubmit={handle} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono uppercase tracking-widest text-[#555]">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              autoFocus
              className="field"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono uppercase tracking-widest text-[#555]">Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                className="field pr-16"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-white text-xs transition-colors select-none"
                tabIndex={-1}
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono uppercase tracking-widest text-[#555]">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "user" | "admin")}
              className="field bg-black"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {error && <p className="text-[#ff4444] text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="btn w-full justify-center py-2.5 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create user"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Reset Password Modal ─────────────────────────────────────────────────────

function ResetPasswordModal({
  userId,
  username,
  onClose,
}: {
  userId: string;
  username: string;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    if (!password) { setError("Enter a new password."); return; }
    if (password.length < 4) { setError("Password must be at least 4 characters."); return; }
    setLoading(true);
    const res = await resetUserPassword(userId, password);
    setLoading(false);
    if (!res.ok) { setError(res.error ?? "Failed."); return; }
    setDone(true);
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-sm bg-[#111] border border-[#333] rounded-xl shadow-2xl">
        <div className="border-b border-[#222] px-5 py-4 flex items-center justify-between">
          <p className="text-sm font-medium text-white">Reset password</p>
          <button
            onClick={onClose}
            className="text-[#555] hover:text-white text-xl leading-none transition-colors"
          >
            ×
          </button>
        </div>
        {done ? (
          <div className="p-5 flex flex-col gap-4 items-center text-center">
            <div className="w-9 h-9 rounded-full bg-[#0070f3]/10 border border-[#0070f3]/30 flex items-center justify-center">
              <span className="text-[#0070f3] text-base">✓</span>
            </div>
            <p className="text-sm text-white">
              Password for <span className="font-medium">{username}</span> updated.
            </p>
            <button onClick={onClose} className="btn w-full justify-center py-2.5">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handle} className="p-5 flex flex-col gap-4">
            <p className="text-xs text-[#555]">
              Set a new password for <span className="text-white font-medium">{username}</span>.
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono uppercase tracking-widest text-[#555]">New password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="new password"
                  autoFocus
                  className="field pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-white text-xs transition-colors select-none"
                  tabIndex={-1}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            {error && <p className="text-[#ff4444] text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="btn w-full justify-center py-2.5 disabled:opacity-50"
            >
              {loading ? "Saving…" : "Reset password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── User Data View ───────────────────────────────────────────────────────────

type MonthEntry = {
  salary: number;
  categories: { amount: number }[];
};

function UserDataView({ userId, username }: { userId: string; username: string }) {
  const [data, setData] = useState<Record<string, MonthEntry> | null>(null);

  useEffect(() => {
    getUserData(userId)
      .then((d) => setData(d as Record<string, MonthEntry>))
      .catch(() => setData({}));
  }, [userId]);

  if (data === null) {
    return <p className="px-5 pb-4 pt-3 text-xs text-[#555]">Loading…</p>;
  }

  const months = Object.keys(data).sort().reverse();

  if (months.length === 0) {
    return <p className="px-5 pb-4 pt-3 text-xs text-[#555]">No data recorded yet.</p>;
  }

  return (
    <div className="px-5 py-4">
      <p className="text-xs font-mono uppercase tracking-widest text-[#555] mb-3">
        Data for {username}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[#555] border-b border-[#1a1a1a]">
              <th className="text-left pb-2 font-mono tracking-widest font-normal">MONTH</th>
              <th className="text-right pb-2 font-mono tracking-widest font-normal">INCOME</th>
              <th className="text-right pb-2 font-mono tracking-widest font-normal">SPENT</th>
              <th className="text-right pb-2 font-mono tracking-widest font-normal">LEFT</th>
              <th className="text-right pb-2 font-mono tracking-widest font-normal">ITEMS</th>
            </tr>
          </thead>
          <tbody>
            {months.map((mk) => {
              const m = data[mk];
              const salary = m?.salary ?? 0;
              const cats = Array.isArray(m?.categories) ? m.categories : [];
              const spent = cats.reduce((s: number, c: { amount?: number }) => s + (c.amount ?? 0), 0);
              const left = salary - spent;
              return (
                <tr key={mk} className="border-b border-[#141414] hover:bg-white/[0.02] transition-colors">
                  <td className="py-2 text-white">{mk}</td>
                  <td className="py-2 text-right text-white tabular-nums">${fmt(salary)}</td>
                  <td className="py-2 text-right text-[#888] tabular-nums">${fmt(spent)}</td>
                  <td className={`py-2 text-right tabular-nums ${left < 0 ? "text-[#ff4444]" : "text-[#0070f3]"}`}>
                    ${fmt(left)}
                  </td>
                  <td className="py-2 text-right text-[#555]">{cats.length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────

export default function AdminPanel({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [resetPw, setResetPw] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    getUsers().then(setUsers);
  }, []);

  async function refresh() {
    setUsers(await getUsers());
  }

  if (!mounted) {
    return <div className="text-[#555] text-sm py-8 text-center">Loading…</div>;
  }

  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <div className="flex flex-col gap-5">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: users.length, color: "text-white" },
          { label: "Admins", value: adminCount, color: "text-[#0070f3]" },
          { label: "Regular", value: users.length - adminCount, color: "text-[#888]" },
        ].map((s) => (
          <div key={s.label} className="card p-4 hover:border-[#444]">
            <p className="text-xs font-mono uppercase tracking-widest text-[#555] mb-1">{s.label}</p>
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* User list */}
      <div className="card overflow-hidden hover:border-[#444]">
        <div className="border-b border-[#222] px-5 py-3 flex items-center justify-between">
          <p className="text-xs font-mono uppercase tracking-widest text-[#555]">Users</p>
          <button
            onClick={() => setShowCreate(true)}
            className="btn text-xs px-3 py-1.5"
          >
            + New user
          </button>
        </div>

        {users.length === 0 ? (
          <p className="px-5 py-8 text-center text-[#555] text-sm">No users found.</p>
        ) : (
          <ul>
            {users.map((u, i) => {
              const isMe = u.id === currentUserId;
              const isExp = expanded === u.id;

              return (
                <li key={u.id} className={i > 0 ? "border-t border-[#1a1a1a]" : ""}>
                  {/* Row */}
                  <div className="px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${u.role === "admin" ? "bg-[#0070f3]" : "bg-[#333]"}`}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-white">{u.username}</span>
                          {isMe && (
                            <span className="text-[10px] px-1.5 py-0.5 border border-[#333] text-[#555] rounded font-mono">you</span>
                          )}
                          <span className={`text-[10px] px-1.5 py-0.5 border rounded font-mono ${u.role === "admin" ? "border-[#0070f3]/40 text-[#0070f3]" : "border-[#2a2a2a] text-[#555]"}`}>
                            {u.role}
                          </span>
                        </div>
                        <p className="text-xs text-[#555] mt-0.5">
                          Joined {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setExpanded(isExp ? null : u.id)}
                        className="btn-ghost text-xs"
                      >
                        {isExp ? "Hide" : "View data"}
                      </button>
                      {!isMe && (
                        <>
                          <button
                            onClick={() => setResetPw(u)}
                            className="btn-ghost text-xs"
                          >
                            Reset pw
                          </button>
                          <button
                            onClick={() => setConfirmDelete(u.id)}
                            className="btn-ghost text-xs hover:text-[#ff4444]"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded data */}
                  {isExp && (
                    <div className="border-t border-[#1a1a1a] bg-[#0a0a0a]">
                      <UserDataView userId={u.id} username={u.username} />
                    </div>
                  )}

                  {/* Delete confirm */}
                  {confirmDelete === u.id && (
                    <div className="border-t border-[#ff4444]/20 bg-[#ff4444]/5 px-5 py-3 flex items-center justify-between gap-4">
                      <p className="text-xs text-[#888]">
                        Delete <span className="text-white font-medium">{u.username}</span> and all their data?
                      </p>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="btn-ghost text-xs border border-[#2a2a2a]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            await deleteUser(u.id);
                            setConfirmDelete(null);
                            setExpanded(null);
                            refresh();
                          }}
                          className="text-xs px-3 py-1.5 bg-[#ff4444] hover:bg-red-600 active:scale-[0.97] text-white rounded transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {showCreate && (
        <CreateUserModal onClose={() => setShowCreate(false)} onCreated={refresh} />
      )}

      {resetPw && (
        <ResetPasswordModal
          userId={resetPw.id}
          username={resetPw.username}
          onClose={() => setResetPw(null)}
        />
      )}
    </div>
  );
}
