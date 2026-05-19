/**
 * Apple touch icon — served at /apple-icon and referenced via
 * <link rel="apple-touch-icon">. Used when iOS Safari users "Add to Home
 * Screen". Apple's recommended size is 180×180 with no transparency.
 */
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#ff7200",
          borderRadius: 38,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 110,
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
