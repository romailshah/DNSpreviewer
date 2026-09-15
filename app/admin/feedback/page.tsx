import { listFeedback } from "@/lib/feedback";
import { FeedbackList } from "@/components/admin/FeedbackList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — Feedback" };

export default function AdminFeedbackPage() {
  const items = listFeedback();
  const open = items.filter((f) => f.status === "new").length;
  return (
    <>
      <div>
        <h2 className="heading text-2xl text-ink-900">Feedback</h2>
        <p className="text-sm text-ink-700">
          {`${open} open · ${items.length} total · sent from the Help & feedback button`}
        </p>
      </div>
      <div className="mt-6">
        <FeedbackList initialItems={items} />
      </div>
    </>
  );
}
