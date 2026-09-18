import { z } from "zod";
import { db } from "./db";

// "help" is a request to have the migration done for you, i.e. a sales lead.
export const FEEDBACK_KINDS = ["problem", "idea", "question", "help"] as const;
export type FeedbackKind = (typeof FEEDBACK_KINDS)[number];
export type FeedbackStatus = "new" | "done";

export const feedbackSchema = z.object({
  kind: z.enum(FEEDBACK_KINDS),
  message: z.string().trim().min(5, "Tell us a little more.").max(4000),
  email: z
    .string()
    .trim()
    .max(254)
    .email("That email doesn't look right.")
    .optional()
    .or(z.literal("")),
  page: z.string().trim().max(500).optional(),
  // Honeypot: real people never see this field, bots fill it in.
  website: z.string().max(0).optional(),
});

export interface Feedback {
  id: number;
  kind: FeedbackKind;
  message: string;
  email: string | null;
  page: string | null;
  userId: string | null;
  userEmail: string | null;
  ip: string | null;
  userAgent: string | null;
  status: FeedbackStatus;
  createdAt: number;
}

interface Row {
  id: number;
  kind: string;
  message: string;
  email: string | null;
  page: string | null;
  user_id: string | null;
  user_email: string | null;
  ip: string | null;
  user_agent: string | null;
  status: string;
  created_at: number;
}

const HOUR_MS = 60 * 60 * 1000;
/** Plenty for a real person, and stops the widget being used to flood the inbox. */
export const FEEDBACK_PER_HOUR = 5;

export function feedbackCountRecentByIp(ip: string): number {
  const r = db()
    .prepare("SELECT COUNT(*) AS n FROM feedback WHERE ip = ? AND created_at > ?")
    .get(ip, Date.now() - HOUR_MS) as { n: number };
  return r.n;
}

export function createFeedback(input: {
  kind: FeedbackKind;
  message: string;
  email: string | null;
  page: string | null;
  userId: string | null;
  ip: string;
  userAgent: string | null;
}): number {
  const info = db()
    .prepare(
      `INSERT INTO feedback (kind, message, email, page, user_id, ip, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.kind,
      input.message,
      input.email,
      input.page,
      input.userId,
      input.ip,
      input.userAgent?.slice(0, 300) ?? null,
      Date.now(),
    );
  return Number(info.lastInsertRowid);
}

export function listFeedback(limit = 200): Feedback[] {
  const rows = db()
    .prepare(
      `SELECT f.*, u.email AS user_email FROM feedback f
       LEFT JOIN users u ON u.id = f.user_id
       ORDER BY f.status = 'done', f.created_at DESC LIMIT ?`,
    )
    .all(limit) as Row[];
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind as FeedbackKind,
    message: r.message,
    email: r.email,
    page: r.page,
    userId: r.user_id,
    userEmail: r.user_email,
    ip: r.ip,
    userAgent: r.user_agent,
    status: r.status as FeedbackStatus,
    createdAt: r.created_at,
  }));
}

export function countNewFeedback(): number {
  const r = db().prepare("SELECT COUNT(*) AS n FROM feedback WHERE status = 'new'").get() as { n: number };
  return r.n;
}

export function setFeedbackStatus(id: number, status: FeedbackStatus): boolean {
  return db().prepare("UPDATE feedback SET status = ? WHERE id = ?").run(status, id).changes > 0;
}
