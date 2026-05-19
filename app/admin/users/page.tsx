import { listUsersAdmin } from "@/lib/auth";
import { UsersTable } from "@/components/admin/UsersTable";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — Users" };

export default function AdminUsersPage() {
  const users = listUsersAdmin();
  return (
    <>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="heading text-2xl text-ink-900">All users</h2>
          <p className="text-sm text-ink-700">
            {users.length} user{users.length === 1 ? "" : "s"} · promote to admin, disable, or delete
          </p>
        </div>
      </div>
      <div className="mt-6">
        <UsersTable initialUsers={users} />
      </div>
    </>
  );
}
