import bcrypt from "bcryptjs";
import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { customAlphabet } from "nanoid";
import { db } from "./db";
import { AUTH_SECRET } from "./env";

const AUTH_COOKIE = "dnsp_session";
const AUTH_SESSION_DAYS = 30;

const newId = customAlphabet("abcdefghijkmnpqrstuvwxyz0123456789", 16);

export type Role = "user" | "admin";

export interface User {
  id: string;
  email: string;
  createdAt: number;
  role: Role;
  disabled: boolean;
}

export interface AdminUserRow extends User {
  previewCount: number;
  lastActivityAt: number | null;
}

export class AuthError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

interface FullRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: number;
  role: string;
  disabled: number;
}

function toUser(r: { id: string; email: string; created_at: number; role: string; disabled: number }): User {
  return {
    id: r.id,
    email: r.email,
    createdAt: r.created_at,
    role: r.role === "admin" ? "admin" : "user",
    disabled: r.disabled === 1,
  };
}

export async function signup(email: string, password: string): Promise<User> {
  const e = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new AuthError("bad_email", "Enter a valid email.");
  if (password.length < 8) throw new AuthError("short_password", "Password must be at least 8 characters.");

  const hash = await bcrypt.hash(password, 10);
  const id = newId();
  const now = Date.now();

  try {
    db()
      .prepare(
        "INSERT INTO users (id, email, password_hash, created_at, role, disabled) VALUES (?, ?, ?, ?, 'user', 0)",
      )
      .run(id, e, hash, now);
  } catch (err) {
    if (String((err as Error).message).includes("UNIQUE")) {
      throw new AuthError("email_taken", "An account with that email already exists.");
    }
    throw err;
  }
  return { id, email: e, createdAt: now, role: "user", disabled: false };
}

export async function login(email: string, password: string): Promise<User> {
  const row = db()
    .prepare(
      "SELECT id, email, password_hash, created_at, role, disabled FROM users WHERE email = ?",
    )
    .get(email.trim().toLowerCase()) as FullRow | undefined;
  if (!row) throw new AuthError("invalid_credentials", "Email or password is incorrect.");
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) throw new AuthError("invalid_credentials", "Email or password is incorrect.");
  if (row.disabled === 1) throw new AuthError("account_disabled", "This account has been disabled.");
  return toUser(row);
}

export function issueSession(userId: string): { token: string; expiresAt: number } {
  const token = randomBytes(32).toString("hex");
  const now = Date.now();
  const expiresAt = now + AUTH_SESSION_DAYS * 24 * 60 * 60 * 1000;
  db()
    .prepare("INSERT INTO auth_sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .run(token, userId, now, expiresAt);
  return { token, expiresAt };
}

export function revokeSession(token: string): void {
  db().prepare("DELETE FROM auth_sessions WHERE token = ?").run(token);
}

export function userFromToken(token: string | undefined): User | null {
  if (!token) return null;
  const now = Date.now();
  const row = db()
    .prepare(
      `SELECT u.id, u.email, u.created_at, u.role, u.disabled
       FROM auth_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > ?`,
    )
    .get(token, now) as
    | { id: string; email: string; created_at: number; role: string; disabled: number }
    | undefined;
  if (!row) return null;
  if (row.disabled === 1) return null;
  return toUser(row);
}

export async function currentUser(): Promise<User | null> {
  const c = await cookies();
  const token = c.get(AUTH_COOKIE)?.value;
  return userFromToken(token);
}

export async function requireAdmin(): Promise<User> {
  const u = await currentUser();
  if (!u) throw new AuthError("not_authenticated", "Login required.");
  if (u.role !== "admin") throw new AuthError("not_admin", "Admin access required.");
  return u;
}

// === Admin user operations ===

export function listUsersAdmin(): AdminUserRow[] {
  const rows = db()
    .prepare(
      `SELECT u.id, u.email, u.created_at, u.role, u.disabled,
              (SELECT COUNT(*) FROM preview_sessions p WHERE p.user_id = u.id) AS preview_count,
              (SELECT MAX(s.created_at) FROM auth_sessions s WHERE s.user_id = u.id) AS last_activity
       FROM users u
       ORDER BY u.created_at DESC`,
    )
    .all() as Array<{
      id: string;
      email: string;
      created_at: number;
      role: string;
      disabled: number;
      preview_count: number;
      last_activity: number | null;
    }>;
  return rows.map((r) => ({
    ...toUser(r),
    previewCount: r.preview_count,
    lastActivityAt: r.last_activity,
  }));
}

export function getUserById(id: string): User | null {
  const row = db()
    .prepare(
      "SELECT id, email, created_at, role, disabled FROM users WHERE id = ?",
    )
    .get(id) as
    | { id: string; email: string; created_at: number; role: string; disabled: number }
    | undefined;
  return row ? toUser(row) : null;
}

export function setUserRole(id: string, role: Role): void {
  db().prepare("UPDATE users SET role = ? WHERE id = ?").run(role, id);
}

export function setUserDisabled(id: string, disabled: boolean): void {
  db().prepare("UPDATE users SET disabled = ? WHERE id = ?").run(disabled ? 1 : 0, id);
  if (disabled) {
    // Kill all their sessions so they can't keep acting.
    db().prepare("DELETE FROM auth_sessions WHERE user_id = ?").run(id);
  }
}

export function deleteUser(id: string): void {
  db().prepare("DELETE FROM users WHERE id = ?").run(id);
}

export function countUsers(): number {
  const r = db().prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
  return r.n;
}

export function countAdmins(): number {
  const r = db()
    .prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'")
    .get() as { n: number };
  return r.n;
}

export async function setAuthCookie(token: string, expiresAt: number, secure: boolean) {
  const c = await cookies();
  c.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function clearAuthCookie() {
  const c = await cookies();
  c.delete(AUTH_COOKIE);
}

export function unlockToken(sessionId: string, passwordHash: string): string {
  return createHmac("sha256", AUTH_SECRET).update(`${sessionId}|${passwordHash}`).digest("hex");
}

export function verifyUnlockToken(token: string, sessionId: string, passwordHash: string): boolean {
  const expected = unlockToken(sessionId, passwordHash);
  if (token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token, "hex"), Buffer.from(expected, "hex"));
}

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

export async function comparePassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}
