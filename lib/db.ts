import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { DATABASE_PATH } from "./env";

type DB = InstanceType<typeof Database>;

const g = globalThis as unknown as { __dnsp_db?: DB };

export function db(): DB {
  if (g.__dnsp_db) return g.__dnsp_db;
  // The DB path is determined at runtime from an env var, so NFT can't trace it.
  // The `turbopackIgnore` comments below silence the "whole project traced" warning.
  const abs = path.isAbsolute(DATABASE_PATH)
    ? DATABASE_PATH
    : path.resolve(/*turbopackIgnore: true*/ process.cwd(), DATABASE_PATH);
  fs.mkdirSync(path.dirname(/*turbopackIgnore: true*/ abs), { recursive: true });
  const d = new Database(abs);
  d.pragma("journal_mode = WAL");
  d.pragma("foreign_keys = ON");
  migrate(d);
  g.__dnsp_db = d;
  return d;
}

function migrate(d: DB) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      disabled INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS auth_sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id);

    CREATE TABLE IF NOT EXISTS preview_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      label TEXT,
      domain TEXT NOT NULL,
      target TEXT NOT NULL,
      protocol TEXT NOT NULL DEFAULT 'https',
      port INTEGER,
      site_type TEXT NOT NULL DEFAULT 'regular',
      subdomain TEXT,
      password_hash TEXT,
      created_at INTEGER NOT NULL,
      expires_at INTEGER,
      disabled INTEGER NOT NULL DEFAULT 0,
      creator_ip TEXT,
      hit_count INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_preview_user ON preview_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_preview_ip_created ON preview_sessions(creator_ip, created_at);
    CREATE INDEX IF NOT EXISTS idx_preview_created ON preview_sessions(created_at);

    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL,
      user_id TEXT,
      ip TEXT,
      details TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at);
    CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_activity_kind ON activity_log(kind);
  `);

  // Lightweight column additions for installs predating the fields above.
  const userCols = d.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
  const has = (name: string) => userCols.some((c) => c.name === name);
  if (!has("role")) {
    d.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'");
  }
  if (!has("disabled")) {
    d.exec("ALTER TABLE users ADD COLUMN disabled INTEGER NOT NULL DEFAULT 0");
  }
}
