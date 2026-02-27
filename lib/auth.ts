"use client";

export type UserRole = "admin" | "user";

export type User = {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
};

export type Session = {
  userId: string;
  username: string;
  role: UserRole;
};

const USERS_KEY = "salary-manager-users";
const SESSION_KEY = "salary-manager-session";

export function getUsers(): User[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as User[]) : [];
  } catch {
    return [];
  }
}

export function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function setSession(session: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode("slmgr:" + password);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createUser(
  username: string,
  password: string,
  forceRole?: UserRole
): Promise<{ ok: boolean; error?: string }> {
  const users = getUsers();
  if (users.find((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return { ok: false, error: "Username already taken." };
  }
  const passwordHash = await hashPassword(password);
  const role: UserRole = forceRole ?? (users.length === 0 ? "admin" : "user");
  const newUser: User = {
    id: crypto.randomUUID(),
    username,
    passwordHash,
    role,
    createdAt: new Date().toISOString(),
  };
  saveUsers([...users, newUser]);
  return { ok: true };
}

export async function loginUser(
  username: string,
  password: string
): Promise<{ ok: boolean; session?: Session; error?: string }> {
  const users = getUsers();
  const user = users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );
  if (!user) return { ok: false, error: "User not found." };
  const hash = await hashPassword(password);
  if (hash !== user.passwordHash)
    return { ok: false, error: "Incorrect password." };
  const session: Session = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };
  setSession(session);
  return { ok: true, session };
}

export function deleteUser(userId: string): void {
  saveUsers(getUsers().filter((u) => u.id !== userId));
  localStorage.removeItem(`salary-manager-data-${userId}`);
}

export function getUserDataKey(userId: string): string {
  return `salary-manager-data-${userId}`;
}

export function getUserData(userId: string) {
  try {
    const raw = localStorage.getItem(getUserDataKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
