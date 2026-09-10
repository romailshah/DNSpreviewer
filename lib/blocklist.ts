/**
 * Built-in blocklist of high-value phishing targets.
 *
 * A wildcard preview domain is an attractive host for credential-harvesting
 * pages: the attacker gets a clean, HTTPS-served subdomain on someone else's
 * domain. If that happens even once and Google Safe Browsing flags
 * dnspreviewer.com, *every* preview link and the marketing site go dark at the
 * same time, and delisting takes days.
 *
 * These entries are matched against both the previewed domain and the upstream
 * target, and matching is suffix-based — blocking "paypal.com" also blocks
 * "login.paypal.com". Extend at runtime with BLOCKED_HOSTS; carve out an
 * exception with BLOCKED_HOSTS_ALLOW.
 */
export const DEFAULT_BLOCKED_HOSTS: string[] = [
  // ─── Payment / money movement ──────────────────────────────────────────────
  "paypal.com",
  "stripe.com",
  "wise.com",
  "payoneer.com",
  "venmo.com",
  "cash.app",
  "revolut.com",
  "westernunion.com",
  "moneygram.com",
  "coinbase.com",
  "binance.com",
  "kraken.com",
  "blockchain.com",
  "metamask.io",
  "ledger.com",
  "trezor.io",

  // ─── Retail banking (most-phished worldwide) ───────────────────────────────
  "chase.com",
  "bankofamerica.com",
  "wellsfargo.com",
  "citi.com",
  "citibank.com",
  "capitalone.com",
  "usbank.com",
  "pnc.com",
  "americanexpress.com",
  "discover.com",
  "hsbc.com",
  "barclays.co.uk",
  "lloydsbank.com",
  "natwest.com",
  "santander.co.uk",
  "monzo.com",
  "starlingbank.com",
  "revolut.com",
  "commbank.com.au",
  "nab.com.au",
  "anz.com",
  "westpac.com.au",
  "rbc.com",
  "td.com",
  "scotiabank.com",
  "hbl.com",
  "meezanbank.com",
  "sbi.co.in",
  "icicibank.com",
  "hdfcbank.com",

  // ─── Webmail / identity providers ──────────────────────────────────────────
  "google.com",
  "gmail.com",
  "accounts.google.com",
  "microsoft.com",
  "microsoftonline.com",
  "live.com",
  "outlook.com",
  "office.com",
  "office365.com",
  "hotmail.com",
  "yahoo.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "zoho.com",
  "icloud.com",
  "apple.com",
  "okta.com",
  "auth0.com",
  "duosecurity.com",

  // ─── Social / messaging (account-takeover targets) ─────────────────────────
  "facebook.com",
  "instagram.com",
  "whatsapp.com",
  "messenger.com",
  "x.com",
  "twitter.com",
  "linkedin.com",
  "tiktok.com",
  "snapchat.com",
  "discord.com",
  "telegram.org",
  "reddit.com",

  // ─── Commerce / delivery (invoice + parcel scams) ──────────────────────────
  "amazon.com",
  "ebay.com",
  "etsy.com",
  "shopify.com",
  "walmart.com",
  "alibaba.com",
  "aliexpress.com",
  "dhl.com",
  "fedex.com",
  "ups.com",
  "usps.com",
  "royalmail.com",
  "auspost.com.au",

  // ─── Developer / hosting credentials ───────────────────────────────────────
  "github.com",
  "gitlab.com",
  "bitbucket.org",
  "npmjs.com",
  "cloudflare.com",
  "aws.amazon.com",
  "console.aws.amazon.com",
  "digitalocean.com",
  "godaddy.com",
  "namecheap.com",
  "fly.io",

  // ─── Government and tax: deliberately absent ───────────────────────────────
  //
  // These were here and have been removed. Government registries are
  // restricted: nobody can register a .gov, .gov.uk or .gov.au domain without
  // being the public body it belongs to, which removes the impersonation risk
  // that justifies everything above.
  //
  // Tax and government phishing is real, but it runs on lookalike domains on
  // ordinary TLDs, hmrc-refund.example rather than hmrc.gov.uk, and a list of
  // genuine government domains never catches those.
  //
  // The cost was concrete. "gov.uk" is a public suffix, so suffix matching
  // blocked every UK public body under it, thousands of unrelated
  // organisations. A council web team hit this in September 2026.
];

/**
 * Never add a public suffix to the list above.
 *
 * Entries are suffix matched, so an entry that is itself a public suffix
 * blocks every domain registered under it. "gov.uk", "co.uk", "com.au" and
 * "org.uk" are registry-operated namespaces, not organisations.
 *
 * This list is checked at module load in development so the mistake cannot be
 * repeated silently.
 */
const PUBLIC_SUFFIXES = [
  "gov.uk",
  "co.uk",
  "org.uk",
  "ac.uk",
  "nhs.uk",
  "com.au",
  "gov.au",
  "net.au",
  "org.au",
  "co.nz",
  "co.za",
  "com.br",
  "co.jp",
  "com.pk",
  "gov.pk",
  "co.in",
  "com.mx",
];

if (process.env.NODE_ENV !== "production") {
  const offenders = DEFAULT_BLOCKED_HOSTS.filter((h) => PUBLIC_SUFFIXES.includes(h));
  if (offenders.length > 0) {
    throw new Error(
      `lib/blocklist.ts contains public suffixes, which would block every domain registered under them: ${offenders.join(", ")}. Block the specific organisation instead.`,
    );
  }
}
