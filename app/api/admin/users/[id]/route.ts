import { NextRequest, NextResponse } from "next/server";
import {
  AuthError,
  countAdmins,
  deleteUser,
  getUserById,
  requireAdmin,
  setUserDisabled,
  setUserRole,
} from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.code }, { status: 403 });
    throw e;
  }
  const { id } = await params;
  const target = getUserById(id);
  if (!target) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as {
    role?: "user" | "admin";
    disabled?: boolean;
  };
  const ip = getClientIp(req.headers);

  if (body.role) {
    // Don't let the last admin demote themselves into a lockout.
    if (body.role === "user" && target.role === "admin" && countAdmins() <= 1) {
      return NextResponse.json(
        { error: "last_admin", message: "Cannot demote the last remaining admin." },
        { status: 400 },
      );
    }
    setUserRole(id, body.role);
    logActivity("user.role_changed", {
      userId: admin.id,
      ip,
      details: { targetUserId: id, newRole: body.role },
    });
  }

  if (typeof body.disabled === "boolean") {
    if (body.disabled && id === admin.id) {
      return NextResponse.json(
        { error: "cant_disable_self", message: "You cannot disable your own account." },
        { status: 400 },
      );
    }
    setUserDisabled(id, body.disabled);
    logActivity(body.disabled ? "user.disabled" : "user.enabled", {
      userId: admin.id,
      ip,
      details: { targetUserId: id },
    });
  }

  return NextResponse.json({ ok: true, user: getUserById(id) });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.code }, { status: 403 });
    throw e;
  }
  const { id } = await params;
  const target = getUserById(id);
  if (!target) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (id === admin.id) {
    return NextResponse.json(
      { error: "cant_delete_self", message: "You cannot delete your own account." },
      { status: 400 },
    );
  }
  if (target.role === "admin" && countAdmins() <= 1) {
    return NextResponse.json(
      { error: "last_admin", message: "Cannot delete the last remaining admin." },
      { status: 400 },
    );
  }
  deleteUser(id);
  logActivity("user.deleted", {
    userId: admin.id,
    ip: getClientIp(req.headers),
    details: { targetUserId: id, email: target.email },
  });
  return NextResponse.json({ ok: true });
}
