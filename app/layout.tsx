import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import { FeedbackWidget } from "@/components/FeedbackWidget";
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
const DEFAULT_TITLE = "DNS Previewer: Preview Your Site Before Switching DNS, Free";
const DEFAULT_DESCRIPTION =
  "Test how your website looks on a new server before switching DNS. Free, with password protection, no-expiry links and wildcard support included. No signup wall.";

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
  // Google Search Console ownership for the https://dnspreviewer.com/ URL-prefix
  // property on romailshah2@gmail.com. Removing this un-verifies the property and
  // Search Console data stops, so leave it in place.
  verification: { google: "pezMuoE-yOGSxJDMqfEZxYUI7hZR7ZbVMm3-JRYJnA4" },
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
        {/* Keep /admin out of Google Analytics. Google's documented opt-out is
            window['ga-disable-<ID>'] = true, which stops gtag sending anything.
            This runs during HTML parsing, before gtag.js loads, and wraps
            pushState/replaceState/popstate so the flag is updated for
            client-side navigation too. Because it installs first, gtag's own
            history listener (enhanced measurement page views) runs after the
            flag has already been set for the new URL.
            A browser that has opened /admin is also marked (localStorage
            dnsp_noga, see NoAnalyticsMarker) and ignored on every page. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var k='ga-disable-${GA_MEASUREMENT_ID}';function owner(){try{return localStorage.getItem('dnsp_noga')==='1';}catch(e){return false;}}function u(){window[k]=owner()||location.pathname.indexOf('/admin')===0;}u();['pushState','replaceState'].forEach(function(m){var o=history[m];history[m]=function(){var r=o.apply(this,arguments);u();return r;};});window.addEventListener('popstate',u);})();`,
          }}
        />
        {children}

        {/* Help & feedback button. Suspense is required because it reads
            the URL's search params (?feedback=problem opens it). */}
        <Suspense fallback={null}>
          <FeedbackWidget />
        </Suspense>

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
