/**
 * Favicon — auto-served at /icon and referenced from <link rel="icon"> on
 * every page. Rendered programmatically so it stays in sync with brand
 * colors and we don't ship a binary asset.
 *
 * Resolution kept small (32×32) so it loads instantly in browser tabs.
 * Apple touch icon is generated separately at 180×180 from apple-icon.tsx.
 */
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#ff7200",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 22,
          fontWeight: 800,
          fontFamily: "sans-serif",
        }}
      >
        D
      </div>
    ),
    { ...size },
  );
}
