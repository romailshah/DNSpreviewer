/**
 * Web App Manifest, served at /manifest.webmanifest.
 *
 * Tells iOS / Android / Chrome how to present the site if a user adds it
 * to their home screen. Also drives PWA install prompts. Lightweight win
 * — no service worker required for the manifest itself.
 */
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DNS Previewer",
    short_name: "DNS Previewer",
    description:
      "Preview your website on a new server before switching DNS. 100% free — password protection, no-expiry links, wildcard support.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff8f2",
    theme_color: "#ff7200",
    orientation: "portrait-primary",
    categories: ["productivity", "developer-tools", "utilities"],
    icons: [
      // Refers to the auto-generated apple-icon route (PNG, 180×180).
      // For PWA install prompts Chrome wants at least one 192×192 and one
      // 512×512 — they get scaled fine from this for now.
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        // Also point Android at the 32x32 favicon for the address bar.
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
    ],
  };
}
