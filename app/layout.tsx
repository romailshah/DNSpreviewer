import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DNS Previewer — Preview your site before switching DNS. Free, forever.",
  description:
    "Test how your website looks on a new server before switching DNS. 100% free — password protection, no-expiry links, wildcard support, all included.",
  metadataBase: new URL("https://dnspreviewer.com"),
  openGraph: {
    title: "DNS Previewer — Free forever",
    description:
      "Preview your website on a new server before switching DNS. Password-protected, no-expiry links. All features free.",
    url: "https://dnspreviewer.com",
    siteName: "DNS Previewer",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
