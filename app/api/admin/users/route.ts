import { NextResponse } from "next/server";
import { AuthError, listUsersAdmin, requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.code }, { status: 403 });
    }
    throw e;
  }
  return NextResponse.json({ users: listUsersAdmin() });
}
