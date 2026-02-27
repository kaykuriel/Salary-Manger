"use client";

import { useState, useRef, useEffect } from "react";
import { getProfile, updateProfile } from "@/lib/auth";

function resizeImage(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load failed")); };
    img.src = url;
  });
}

export default function ProfileEditor({ username: initialUsername }: { username: string }) {
  const [avatar, setAvatar]         = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [username, setUsername]     = useState(initialUsername);
  const [currentPw, setCurrentPw]   = useState("");
  const [newPw, setNewPw]           = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getProfile().then((p) => { if (p?.avatar) setAvatar(p.avatar); });
  }, []);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      const base64 = await resizeImage(file);
      setAvatar(base64);
      await updateProfile({ avatar: base64 });
    } catch {
      // ignore
    } finally {
      setAvatarLoading(false);
      // reset so same file can be re-selected
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (newPw && newPw !== confirmPw) {
      setMsg({ ok: false, text: "New passwords don't match." });
      return;
    }

    const payload: Parameters<typeof updateProfile>[0] = {};
    if (username.trim() && username.trim() !== initialUsername) payload.username = username.trim();
    if (newPw) { payload.currentPassword = currentPw; payload.newPassword = newPw; }

    if (Object.keys(payload).length === 0) {
      setMsg({ ok: false, text: "No changes to save." });
      return;
    }

    setSaving(true);
    const res = await updateProfile(payload);
    setSaving(false);

    if (!res.ok) {
      setMsg({ ok: false, text: res.error ?? "Failed." });
    } else {
      setMsg({ ok: true, text: username.trim() !== initialUsername ? "Saved! Reload the page to see the new username." : "Password updated." });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    }
  }

  const initials = initialUsername.slice(0, 2).toUpperCase();

  return (
    <div className="max-w-sm mx-auto px-4 py-8 flex flex-col gap-6">

      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={avatarLoading}
          className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-[#333] hover:border-[#0070f3] transition-colors duration-200 disabled:opacity-60"
        >
          {avatar ? (
            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[#111] flex items-center justify-center">
              <span className="text-2xl font-semibold text-[#444]">{initials}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="text-white text-xs">{avatarLoading ? "…" : "Change"}</span>
          </div>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        <p className="text-xs text-[#555]">Click to change photo</p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-5">

        {/* Account */}
        <div className="card p-5 flex flex-col gap-4 hover:border-[#444]">
          <p className="text-xs font-mono uppercase tracking-widest text-[#555]">Account</p>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono uppercase tracking-widest text-[#555]">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="field"
            />
          </div>
        </div>

        {/* Password */}
        <div className="card p-5 flex flex-col gap-4 hover:border-[#444]">
          <p className="text-xs font-mono uppercase tracking-widest text-[#555]">Change password</p>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono uppercase tracking-widest text-[#555]">Current password</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="current password"
                className="field pr-16"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-white text-xs transition-colors select-none"
                tabIndex={-1}
              >
                {showCurrent ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono uppercase tracking-widest text-[#555]">New password</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="new password"
                className="field pr-16"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-white text-xs transition-colors select-none"
                tabIndex={-1}
              >
                {showNew ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono uppercase tracking-widest text-[#555]">Confirm new password</label>
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="confirm password"
              className="field"
            />
          </div>
        </div>

        {msg && (
          <p className={`text-xs ${msg.ok ? "text-[#50e3c2]" : "text-[#ff4444]"}`}>{msg.text}</p>
        )}

        <button type="submit" disabled={saving} className="btn justify-center py-3 disabled:opacity-50">
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
