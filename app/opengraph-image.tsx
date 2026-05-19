/**
 * Programmatic Open Graph image, served at /opengraph-image.<hash>.png.
 *
 * Next.js auto-injects `<meta property="og:image">` (and Twitter card image)
 * pointing at this file's URL for every route that doesn't define its own
 * opengraph-image. So a single file = social previews on every page.
 *
 * Rendered with @vercel/og (Satori). Notes about limitations:
 *  - Flexbox only (no grid).
 *  - No custom fonts unless you load .ttf/.woff as ArrayBuffer; we stick
 *    with Satori's bundled sans-serif fallback for now — looks fine.
 *  - All children of a `<div>` must declare `display`, hence the explicit
 *    `display: 'flex'` everywhere.
 *
 * Test the rendered image locally / in prod by opening:
 *   https://dnspreviewer.com/opengraph-image
 */
import { ImageResponse } from "next/og";

export const alt =
  "DNS Previewer — Preview your website before switching DNS. Free, forever.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Cache for a day. Update the cache key (rename file or bump revalidate
// inside metadata) to bust if you redesign.
export const revalidate = 86400;

const BRAND = "#ff7200";
const BRAND_LIGHT = "#ffe4c7";
const CREAM = "#fff8f2";
const INK_900 = "#171717";
const INK_500 = "#737373";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: `linear-gradient(135deg, ${CREAM} 0%, ${BRAND_LIGHT} 100%)`,
          fontFamily: "sans-serif",
        }}
      >
        {/* ── Logo lockup ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 88,
              height: 88,
              background: BRAND,
              borderRadius: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 56,
              fontWeight: 700,
              boxShadow: `0 10px 40px -10px ${BRAND}80`,
            }}
          >
            ◉
          </div>
          <div
            style={{
              fontSize: 52,
              fontWeight: 800,
              color: INK_900,
              letterSpacing: "-0.02em",
            }}
          >
            DNS Previewer
          </div>
        </div>

        {/* ── Headline ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div
            style={{
              fontSize: 92,
              fontWeight: 800,
              color: INK_900,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
            }}
          >
            Preview your website
          </div>
          <div
            style={{
              fontSize: 92,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              display: "flex",
              gap: 18,
            }}
          >
            <span style={{ color: BRAND }}>before</span>
            <span style={{ color: INK_900 }}>switching DNS.</span>
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 32,
              color: INK_500,
              lineHeight: 1.3,
              maxWidth: 920,
            }}
          >
            Every feature competitors paywall — password protection, no-expiry
            links, wildcard — free for everyone.
          </div>
        </div>

        {/* ── Footer chips + URL ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: 16 }}>
            <div
              style={{
                background: BRAND,
                color: "white",
                padding: "14px 28px",
                borderRadius: 999,
                fontSize: 28,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
              }}
            >
              100% Free
            </div>
            <div
              style={{
                background: "white",
                color: INK_500,
                padding: "14px 28px",
                borderRadius: 999,
                fontSize: 28,
                fontWeight: 600,
                border: "2px solid #e5e5e5",
                display: "flex",
                alignItems: "center",
              }}
            >
              No credit card
            </div>
          </div>
          <div
            style={{
              fontSize: 30,
              color: INK_500,
              fontWeight: 600,
              display: "flex",
            }}
          >
            dnspreviewer.com
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
