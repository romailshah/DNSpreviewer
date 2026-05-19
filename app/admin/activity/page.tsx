import { activityCount, recentActivity } from "@/lib/activity";
import { ActivityRow } from "@/components/admin/ActivityRow";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — Activity log" };

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

const PAGE_SIZE = 100;

export default async function ActivityPage({ searchParams }: PageProps) {
  const { page: pageParam = "1" } = await searchParams;
  const page = Math.max(1, parseInt(pageParam, 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const total = activityCount();
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const items = recentActivity(PAGE_SIZE, offset);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="heading text-xl sm:text-2xl text-ink-900">Activity log</h2>
          <p className="text-sm text-ink-700">
            {total.toLocaleString()} events · showing {items.length} (page {page} of {totalPages})
          </p>
        </div>
        <a
          href="/api/admin/activity/export"
          className="btn-ghost text-sm self-start sm:self-auto"
          download
        >
          ⬇ Download CSV
        </a>
      </div>

      <div className="mt-6 card">
        {items.length === 0 ? (
          <p className="text-sm text-ink-500">No activity yet.</p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {items.map((a) => (
              <li key={a.id}>
                <ActivityRow activity={a} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <a
            href={`?page=${Math.max(1, page - 1)}`}
            className={`btn-ghost ${page === 1 ? "pointer-events-none opacity-50" : ""}`}
          >
            ← Prev
          </a>
          <span className="text-sm text-ink-700">
            Page {page} of {totalPages}
          </span>
          <a
            href={`?page=${Math.min(totalPages, page + 1)}`}
            className={`btn-ghost ${page === totalPages ? "pointer-events-none opacity-50" : ""}`}
          >
            Next →
          </a>
        </div>
      )}
    </>
  );
}
