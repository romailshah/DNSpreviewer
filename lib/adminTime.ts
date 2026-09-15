/**
 * Admin console dates, always in Pakistan time (PKT, UTC+5, no daylight
 * saving) so the server-rendered and browser-rendered parts agree and match
 * the owner's clock, wherever the server or browser happens to be.
 */
const TIME_ZONE = "Asia/Karachi";

const dateTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const dateOnly = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** e.g. "16 Sept 2026, 3:42 pm PKT" */
export function adminDateTime(ts: number): string {
  return `${dateTime.format(ts)} PKT`;
}

/** e.g. "16 Sept 2026" */
export function adminDate(ts: number): string {
  return dateOnly.format(ts);
}
