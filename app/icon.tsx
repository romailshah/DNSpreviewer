/**
 * Favicon — auto-served at /icon and referenced from <link rel="icon"> on
 * every page. Also the source for the /favicon.ico legacy path via a
 * rewrite in next.config.js.
 *
 * Size: 96×96. Google's favicon-in-search guidelines REQUIRE a multiple
 * of 48px square (48, 96, 144, ...). Smaller than that is silently
 * rejected and the generic globe is shown in search results.
 *   https://developers.google.com/search/docs/appearance/favicon-in-search
 *
 * Apple touch icon is generated separately at 180×180 from apple-icon.tsx.
 */
import { ImageResponse } from "next/og";

export const size = { width: 96, height: 96 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#ff7200",
          borderRadius: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 64,
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
