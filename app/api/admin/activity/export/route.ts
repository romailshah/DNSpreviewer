import { NextResponse } from "next/server";
import { AuthError, requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Row {
  id: number;
  kind: string;
  user_id: string | null;
  ip: string | null;
  details: string | null;
  created_at: number;
}

function csvEscape(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  // Quote if contains comma, quote, newline, or carriage return; double-up internal quotes.
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.code }, { status: 403 });
    throw e;
  }

  // Stream every row — activity_log is small and pruned on a schedule.
  const rows = db()
    .prepare("SELECT * FROM activity_log ORDER BY created_at DESC")
    .all() as Row[];

  const header = ["id", "createdAt", "kind", "userId", "ip", "details"].join(",");
  const lines = rows.map((r) =>
    [
      csvEscape(r.id),
      csvEscape(new Date(r.created_at).toISOString()),
      csvEscape(r.kind),
      csvEscape(r.user_id),
      csvEscape(r.ip),
      csvEscape(r.details ?? ""),
    ].join(","),
  );
  // BOM so Excel detects UTF-8 correctly.
  const body = "\uFEFF" + header + "\n" + lines.join("\n") + (lines.length ? "\n" : "");

  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return new NextResponse(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="activity-${stamp}.csv"`,
      "cache-control": "no-store",
    },
  });
}
