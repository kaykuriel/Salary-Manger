"use client";

export type UserRole = "admin" | "user";

export type User = {
  id: string;
  username: string;
  role: UserRole;
  createdAt: string;
};

export type Session = {
  userId: string;
  username: string;
  role: UserRole;
};

export async function getSession(): Promise<Session | null> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function loginUser(
  username: string,
  password: string
): Promise<{ ok: boolean; session?: Session; error?: string }> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    return res.json();
  } catch {
    return { ok: false, error: "Network error." };
  }
}

export async function logoutUser(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function createUser(
  username: string,
  password: string,
  role?: UserRole
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, ...(role ? { role } : {}) }),
    });
    return res.json();
  } catch {
    return { ok: false, error: "Network error." };
  }
}

export async function getUsers(): Promise<User[]> {
  try {
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function deleteUser(userId: string): Promise<void> {
  await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
}

export async function getUserData(
  userId: string
): Promise<Record<string, { salary: number; categories: { amount: number }[] }>> {
  try {
    const res = await fetch(`/api/admin/users/${userId}/data`, { cache: "no-store" });
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}
