"use client";

import { useEffect } from "react";

/**
 * Marks this browser as the owner's, so Google Analytics ignores it on every
 * page from now on, not just /admin. The inline script in app/layout.tsx
 * reads this localStorage key before gtag.js loads.
 *
 * Rendered only inside the admin layout, which already requires an admin
 * login, so no visitor can end up marked by accident. To undo it, clear
 * site data for dnspreviewer.com in the browser.
 */
export const NO_ANALYTICS_KEY = "dnsp_noga";

export function NoAnalyticsMarker() {
  useEffect(() => {
    try {
      localStorage.setItem(NO_ANALYTICS_KEY, "1");
    } catch {}
  }, []);
  return null;
}
