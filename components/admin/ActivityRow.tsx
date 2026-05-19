import type { Activity, ActivityKind } from "@/lib/activity";

const KIND_META: Record<ActivityKind, { label: string; color: string }> = {
  "user.signup": { label: "signup", color: "bg-emerald-100 text-emerald-800" },
  "user.login": { label: "login", color: "bg-sky-100 text-sky-800" },
  "user.logout": { label: "logout", color: "bg-ink-100 text-ink-700" },
  "user.disabled": { label: "user disabled", color: "bg-amber-100 text-amber-800" },
  "user.enabled": { label: "user enabled", color: "bg-emerald-100 text-emerald-800" },
  "user.role_changed": { label: "role changed", color: "bg-violet-100 text-violet-800" },
  "user.deleted": { label: "user deleted", color: "bg-red-100 text-red-800" },
  "preview.created": { label: "preview created", color: "bg-brand-100 text-brand-700" },
  "preview.disabled": { label: "preview disabled", color: "bg-amber-100 text-amber-800" },
  "preview.enabled": { label: "preview enabled", color: "bg-emerald-100 text-emerald-800" },
  "preview.deleted": { label: "preview deleted", color: "bg-red-100 text-red-800" },
  "admin.action": { label: "admin action", color: "bg-violet-100 text-violet-800" },
};

export function ActivityRow({ activity, compact }: { activity: Activity; compact?: boolean }) {
  const meta = KIND_META[activity.kind] || { label: activity.kind, color: "bg-ink-100 text-ink-700" };
  const ts = new Date(activity.createdAt);
  const details = activity.details;

  return (
    <div className={compact ? "flex items-start justify-between gap-3" : "flex items-start justify-between gap-3 py-3"}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.color}`}
          >
            {meta.label}
          </span>
          {activity.ip && (
            <code className="text-[11px] bg-ink-100 text-ink-700 rounded px-1.5 py-0.5">
              {activity.ip}
            </code>
          )}
        </div>
        {details && Object.keys(details).length > 0 && (
          <div className="mt-1 text-xs text-ink-700 break-all">
            {Object.entries(details).map(([k, v]) => (
              <span key={k} className="mr-3">
                <span className="text-ink-500">{k}:</span>{" "}
                <code>{typeof v === "string" ? v : JSON.stringify(v)}</code>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="shrink-0 text-xs text-ink-500 text-right" title={ts.toISOString()}>
        {ts.toLocaleString()}
      </div>
    </div>
  );
}
