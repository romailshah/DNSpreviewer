import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

/**
 * Google Analytics 4 Measurement ID. Public identifier — safe to commit.
 * Find/replace in this file to swap; loads via next/script below.
 *
 * Notes:
 *  - Only renders when NODE_ENV === "production" so `npm run dev` clicks
 *    don't pollute the report.
 *  - Preview subdomains (*.dnspreviewer.com) NEVER include this script
 *    because those responses are served by the proxy route and bypass
 *    this layout entirely.
 */
const GA_MEASUREMENT_ID = "G-749RD6V0WN";

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

const SITE_URL = "https://dnspreviewer.com";
const SITE_NAME = "DNS Previewer";
const DEFAULT_TITLE = "DNS Previewer — Preview your site before switching DNS. Free, forever.";
const DEFAULT_DESCRIPTION =
  "Test how your website looks on a new server before switching DNS. 100% free — password protection, no-expiry links, wildcard support, all included. No signup wall.";

export const metadata: Metadata = {
  // `%s | DNS Previewer` is what per-page titles render as; the homepage uses
  // the default (no template).
  title: {
    default: DEFAULT_TITLE,
    template: "%s | DNS Previewer",
  },
  description: DEFAULT_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  keywords: [
    "DNS preview",
    "DNS migration",
    "preview website before DNS change",
    "test website on new server",
    "skipdns alternative",
    "free DNS preview",
    "wildcard DNS preview",
    "preview new hosting",
    "test site before going live",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  // Search engines: index marketing pages by default; utility pages opt OUT
  // via their own metadata.robots, and preview-subdomain responses get
  // X-Robots-Tag: noindex via the proxy route handler.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    creator: "@dnspreviewer",
  },
  // No verification codes set yet — add them here when you register the site
  // with Google Search Console / Bing Webmaster Tools.
  // verification: { google: "...", other: { "msvalidate.01": "..." } },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ff7200",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const showAnalytics = process.env.NODE_ENV === "production";
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        {children}

        {/* Google Analytics 4 — production only. See GA_MEASUREMENT_ID above. */}
        {showAnalytics && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
