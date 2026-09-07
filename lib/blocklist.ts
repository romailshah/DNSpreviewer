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

  // ─── Government / tax ──────────────────────────────────────────────────────
  "irs.gov",
  "gov.uk",
  "hmrc.gov.uk",
  "ato.gov.au",
  "mygov.au",
  "canada.ca",
  "fbr.gov.pk",
];
