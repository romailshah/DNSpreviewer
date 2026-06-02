---
title: "I crashed a client's WordPress site for 14 hours during a DNS migration. Here's the exact pre-flight checklist I now use."
seoTitle: "WordPress Migration Checklist: 18 Things to Test Before You Flip DNS"
description: "After a botched Black Friday migration cost a client $14k in downtime, I built an 18-step pre-flight checklist that catches the failure modes WP migration tutorials skip."
publishedAt: "2026-06-02"
author: "Romail Shah"
authorBio: "Romail Shah is a full-stack developer and the founder of DNS Previewer — a free tool for previewing websites on new servers before flipping DNS. He's been migrating WordPress sites since 2017 and writing about his mistakes (publicly) since 2024."
category: "Migration"
tags: ["wordpress", "dns", "migration", "checklist", "hosting"]
keywords: ["wordpress migration checklist", "test website before changing DNS", "WordPress migration downtime", "preview website on new server", "wordpress hosting migration", "DNS preview tool"]
faqs:
  - q: "How long does a WordPress migration usually take?"
    a: "A clean WordPress migration takes 1-4 hours of active work for a small-to-medium site, plus another 24-48 hours of DNS propagation if you raise the TTL afterward. Larger sites with extensive media libraries and custom integrations can take a full day. The migration itself isn't the hard part — testing the new server under your real domain before flipping DNS is what catches most issues, and that step alone can take half a day if you don't have proper tooling."
  - q: "Can you migrate a WordPress site without downtime?"
    a: "Yes, if you do the prep work properly. Reduce DNS TTL to 60 seconds at least 24 hours before the migration. Test the new server under your real domain (not via /etc/hosts or by hitting the server IP) so you catch vhost and SSL issues before flipping records. Have a documented and tested rollback procedure. Done right, the actual visible downtime is under 60 seconds. Done wrong, you get hours of broken pages."
  - q: "What's the difference between a staging environment and a DNS preview?"
    a: "A staging site runs at a different URL (staging.example.com), so cookies, SSL certificates, CDN configurations, and URL rewrites all differ from production. A DNS preview tool lets you test how your real domain will respond when DNS resolves to the new server — same Host header, same TLS SNI, same edge behavior — without actually changing DNS. Staging catches code bugs; DNS preview catches infrastructure mismatches that only appear when the real domain hits the new server."
  - q: "Why does my WordPress site break after migrating to a new host?"
    a: "The most common causes, in rough order of frequency: vhost configuration mismatching the real Host header, SSL certificate not covering the domain, WP_HOME or WP_SITEURL pointing at the wrong domain or scheme, SPF and DKIM records updated to the new host's mail server (breaking transactional email), and serialized PHP data corrupted by a phpMyAdmin search-replace instead of a WP-CLI one. The first two only manifest after DNS flips, which is why testing under the new IP with the correct Host header is essential."
  - q: "Should I lower DNS TTL before migrating a WordPress site?"
    a: "Yes — drop it to 60 seconds at least 24 hours before the migration so global DNS caches refresh quickly when you flip. After the migration is stable for 48 hours, raise it back to a reasonable value (3600 to 86400 seconds) to reduce DNS query load. Skip this step and your 'instant cutover' can leave some visitors hitting the old server for hours after you think you're done."
  - q: "Is it safe to migrate a WordPress site on weekends?"
    a: "Technically yes — DNS doesn't care what day of the week it is. Operationally no — if your new host has issues, support response times on weekends and holidays are slower. Schedule migrations for Tuesday or Wednesday mornings (in your host's primary support timezone) so their team is fully staffed and you're fresh enough to debug a 7am issue if something goes wrong."
---

It was the Tuesday before Black Friday 2024.

A long-time client — a mid-sized DTC e-commerce brand on WordPress and WooCommerce, doing roughly $40k a week in revenue — had asked me to migrate them off their old shared host. The new host (a managed WordPress provider, four times the price) was going to handle the traffic spike better. We had a four-day window before Black Friday traffic started ramping.

I'd done dozens of these migrations. About two thousand hours of WordPress dev work behind me. I'd tested everything I knew to test.

Here's exactly what I did before flipping DNS:

- Migrated the full database to the new host
- Copied `wp-content` with `rsync` (twice, just to be sure)
- Updated `wp-config.php` with new database credentials
- Tested the new server by hitting its IP directly in the browser — loaded fine
- Edited my local `/etc/hosts` to map the client's domain to the new IP — site loaded fine
- Ran a WP-CLI `search-replace` on the old domain → new domain in the database
- Pinged the new host's support team to confirm everything looked right

Everything checked out.

At 9pm Tuesday I lowered the TTL on the existing DNS records to 5 minutes. At 4am Wednesday, with the lowered TTL meaning global DNS caches would refresh quickly, I flipped the A record to point at the new host.

By 4:15am the client's site was loading. From my laptop, from the new server's IP, both showed the homepage rendering fine.

I went to bed.

At 7:23am my phone rang. The client. "Romail. The site's down. Customers are emailing. Why is checkout broken?"

I sat up fast.

The homepage loaded fine on my laptop. But when I navigated to `/shop`, the page rendered without styles. Click any product? 404. Try to add to cart? "Network error." The WooCommerce REST API was returning HTML instead of JSON.

I'd missed something.

## Fourteen hours

Fourteen hours later — after a frantic morning of debugging, a phone call with a colleague in Pacific time who'd seen something similar once, two support tickets, and one rolled-back DNS change that took another six hours to propagate fully — we'd identified it.

The new host had a default Apache configuration that was strict about how WordPress's `WP_SITEURL` constant matched the virtual host configuration. The `Host` header from real browser requests (with `www.` stripped per the redirect chain) didn't match what the vhost expected. Static assets served from one origin, REST API rejected requests from another. Mixed content errors. CORS errors. The whole stack got out of sync.

Could I have caught this in testing? In theory, yes. The `/etc/hosts` trick gets close, but it doesn't replicate how the new server would actually respond to traffic *as if DNS had already switched* — including all the upstream proxy chains, CDN edge configurations, and host header normalization that real browsers trigger.

By the time we'd fully resolved it, the client estimated they'd lost around $14,000 in pre-Black-Friday traffic and conversions. They didn't fire me. But they also stopped recommending me to other founders in their network for about a year. Fair.

I never want anyone — myself, a client, a freelancer reading this — to live through that morning again.

So here's the checklist I now run before every DNS flip. Eighteen items. I'll tell you which six I built [DNS Previewer](https://dnspreviewer.com) to handle automatically, and which twelve you still have to do yourself.

## Why "just test on the new server" isn't enough

Most WordPress migration tutorials end with "now test the new server before flipping DNS." Then they list three testing methods that don't actually catch real-world issues.

**Method 1: the `/etc/hosts` trick.** You edit your machine's hosts file to point the domain at the new IP. The site loads in your browser. Done, right?

No. This only works on **your** machine. You can't share the link with the client, their QA team, or anyone else. You can't test from a mobile phone on cellular data. You can't test from the AWS region where most of your real visitors come from. And critically, it doesn't reproduce CDN edge behavior, HTTP/2 upgrade negotiation, or hostname-aware proxy chains — all of which only kick in once real DNS resolves to the new server.

**Method 2: hitting the server IP directly.** You navigate to `https://192.0.2.1` and the page loads.

Also no, for several reasons. The browser sends the IP address in the `Host` header instead of your domain. Your server's vhost configuration probably rejects it or serves a different (default) vhost. SSL fails because the cert doesn't cover the IP — the warnings you click through hide TLS-level issues that real users will hit. And even when the page renders, WordPress's `WP_HOME` rewrites internal URLs to point at the IP, not your domain, so internal links go nowhere useful.

**Method 3: staging subdomains.** You set up `staging.example.com` pointing at the new host and run QA there.

This catches some things — the WordPress install, the database connection, basic theme rendering, plugin activation. But you're testing under a **different domain** than production. Cookies set on `staging.example.com` don't match what real users will see at `example.com`. OAuth callback URLs won't match. SSL certs are different. URL rewriting rules are different. Your CDN's edge configuration is different. You're testing maybe 70% of the migration, and the 30% you're not testing is exactly where the failures hide.

What you actually need: a way to test how your domain will behave when DNS resolves to the new server — *before* you've changed DNS records — from any machine, anywhere. The next 18 items get you there.

## The 18-step pre-flight checklist

I run through this every time. It takes 20-30 minutes. I save more time than that not having to fix problems after the fact, by orders of magnitude.

### Section 1: Server preparation

**1. SSL certificate is installed for the actual domain, not just the IP.**

If your new host says "SSL is set up" but the cert's Common Name is the server's hostname (`web-server-04.somehost.net`) rather than your domain (`example.com`), the cert won't validate when real traffic hits it. Check the issued cert's SAN list. The simplest test: `openssl s_client -connect newserver.ip:443 -servername example.com 2>/dev/null | openssl x509 -noout -subject -ext subjectAltName`.

**2. Both port 80 (HTTP) and port 443 (HTTPS) are listening and not redirecting incorrectly.**

A common mistake: the new host redirects all HTTP to HTTPS unconditionally, which breaks ACME (Let's Encrypt) renewal challenges on path `/.well-known/acme-challenge/`. Or worse: HTTPS redirects 308 back to HTTP because of a misconfigured load balancer. `curl -v` both ports.

**3. `wp-config.php` database credentials match the new database.**

Obvious, but I've seen this miss when the database was migrated to a new server with different host/port/credentials and `wp-config.php` was copied from the old install without updating. The site appears to load (cached pages from a CDN) until anyone tries to log in.

**4. WordPress cron is running via real system cron, not WP-Cron.**

WP-Cron only fires on page loads. If the new host has any caching layer in front of WordPress, scheduled jobs (backups, emails, posts, recurring payments) silently stop running. Add a system cron entry: `*/5 * * * * curl -s https://example.com/wp-cron.php?doing_wp_cron > /dev/null 2>&1`. Verify it runs.

**5. PHP version + required extensions match what the site needs.**

Check `mb_string`, `curl`, `gd`, `imagick`, `intl`, `xml`, `zip`, `mysqli`. WooCommerce specifically needs `intl` for currency formatting; without it, prices render with raw codes. The new host's default PHP install often omits one of these. `php -m | grep -E 'mbstring|curl|gd|imagick|intl|xml|zip|mysqli'`.

### Section 2: WordPress configuration

**6. `WP_HOME` and `WP_SITEURL` constants resolve correctly.**

If hardcoded in `wp-config.php`, they should be the production domain (not a staging value). If left to the database, the `wp_options` table values should be correct. Pro tip: don't hardcode unless you have to — it makes future moves harder.

**7. Permalinks are flushed, and `.htaccess` (or the nginx equivalent) is in place.**

Migrated sites frequently have permalink rewrites that worked on Apache but break under nginx, or vice versa. Visit Settings → Permalinks and click "Save Changes" once to flush. Test a deeply-nested URL: `https://example.com/category/sub-category/some-post/`. Should return 200, not 404.

**8. Database search-and-replace for old → new domain is complete.**

Use WP-CLI, not phpMyAdmin. `wp search-replace 'old-domain.com' 'new-domain.com' --skip-columns=guid --dry-run` first to see scope; then drop `--dry-run`. PHPMyAdmin's find-replace doesn't handle serialized PHP data correctly — it'll corrupt theme settings, Elementor data, and most caching plugin configurations.

**9. All plugins are active and don't reference legacy paths.**

Check the `wp-content/plugins/` directory matches what `wp_options` thinks is active. Some plugins (caching, backup, security) store absolute filesystem paths in their settings — those break when the install moves to a new server with a different directory structure. Look in `wp-content/uploads/` for the same issue with media URLs.

**10. Theme assets (uploads, custom CSS, fonts) are present.**

Compare `wp-content/uploads/` sizes between the old and new servers. A common miss: timed-out rsync transferred 99% of files, you didn't notice, and now 1 in 100 product images returns 404.

### Section 3: The "test under new DNS" simulation

This is the section that would have saved me from the 14-hour outage. It's also the section most migration tutorials skip entirely.

**11. Preview the live site under the new server's IP as if DNS had already switched.**

Not via `/etc/hosts`. Not via the IP directly. Not via a staging subdomain. You need to simulate how your actual domain (`example.com`) will respond when DNS resolves to the new server — including the correct `Host` header, the correct TLS SNI, the correct upstream behavior — from any device, anywhere on the internet.

This is the gap I built [DNS Previewer](https://dnspreviewer.com) to fill. You enter your domain and the new server's IP; it gives you a temporary URL like `xxxxxxxxxx.dnspreviewer.com` that reverse-proxies your target server with the right Host header and TLS SNI for your real domain. You — and your client — can open it on any device and see exactly what real visitors will see post-flip. Skipdns.link sells the same thing starting at $9.9/mo, with the useful features (password protection, no-expiry links, wildcard subdomain support) gated behind $39.9/mo+ tiers. Both work. I built mine free because DNS migration testing shouldn't cost a subscription.

Use whichever you prefer. Just *don't skip this step*. It's the difference between catching a vhost mismatch on Monday and catching it from a panicked client call at 7am Friday.

**12. Test the critical user flows under the preview URL.**

Specifically: homepage, login, password reset, add to cart, checkout, contact form, account creation. For WooCommerce: search for a product, filter by category, view a product page, run a coupon code through checkout (use a $0.01 test product and Stripe's test mode if needed). Don't just verify the pages load — verify the **flows** complete. A page that 200s but a form that 500s when submitted is still broken.

**13. Test from a different device or network than your dev machine.**

Open the preview URL on your phone over cellular data. Then on a different laptop on a different ISP. Then through a VPN to a region where your actual customers live. Edge cases — CDN routing, IPv4-only fallback, geographically split DNS — only show up when you test from outside your usual setup.

### Section 4: External integration checks

**14. Email DNS records (SPF, DKIM, DMARC) still point at your email provider, not your hosting provider's mail server.**

Almost every WordPress migration breaks transactional email because the new hosting provider helpfully sets up their own mail server and inserts an SPF record that overrides your existing one. Result: WooCommerce order confirmations and password-reset emails start landing in spam, or get rejected outright. Run `dig +short txt example.com` and verify your SPF record still includes `include:_spf.google.com` (or whatever your email provider's record is) and **not** your new host's mail server.

**15. CDN configurations are updated.**

If you're behind Cloudflare, BunnyCDN, KeyCDN, or any other CDN, the origin server's IP has changed. You need to update the CDN's origin pull config *before* DNS flips, or the CDN will pull from the old server for hours after your "migration" is complete.

**16. Third-party services that whitelist your IP are updated.**

Payment gateways, webhook endpoints, API integrations, fraud detection services — anything that has your old server's IP on an allow-list needs the new IP added. Stripe and PayPal usually don't (they don't IP-whitelist incoming webhook responses), but I've seen Shopify integrations, custom B2B APIs, and SSO providers that did.

### Section 5: Pull-the-trigger phase

**17. DNS TTL is reduced to 60 seconds at least 24 hours before the flip.**

The current TTL on your A record determines how long DNS caches around the world will hold stale records. If your current TTL is 14400 (4 hours), then for up to 4 hours after your "instant" cutover, some visitors will still hit the old server. Reduce it to 60 seconds well in advance. After the migration is verified stable for 48 hours, raise it back to something sensible (3600).

**18. Have a documented rollback procedure ready.**

If something goes catastrophically wrong post-flip, you need to be able to revert the A record in under a minute, from your phone, without thinking. Have the old IP written down. Have your DNS provider's mobile app installed. Test the rollback procedure with a low-stakes record (a non-production subdomain) before the real migration so you know how long propagation actually takes for your DNS provider.

## The six steps DNS Previewer eliminates

Going back to the list, steps **11, 12, and 13** used to take me half a day per migration. Now they take about 30 seconds: I create a preview URL, send it to the client, they click around, we both confirm the new server responds correctly to real domain traffic. Steps **15 and 16** are also faster because I can show CDN and webhook providers the live preview URL when escalating support tickets — they can see exactly what's happening rather than working from my screenshot.

The other 12 items are still on you. They're the ones that need ops knowledge, not tooling.

## What changed for me after building the tool

After the Black Friday disaster, I spent a couple of weekends building [DNS Previewer](https://dnspreviewer.com). The concept isn't novel — it's the same model as skipdns.link, which has been around for years. Mine's just free, and I built it because I'd refused to pay a $39.9/mo subscription for a tool I'd use maybe four times a year.

The first time I used it on a real client migration, the preview caught a server-config issue I would have otherwise discovered the morning after the flip. The kind of thing where you'd be on the phone with the client at 6:30am explaining why their site is broken.

I've used it on every migration since. So have a few hundred other people who've signed up in the last few weeks.

## A few final thoughts

A few things I wish I'd known before that Black Friday:

- **Test the rollback before you test the cutover.** If you can't smoothly revert, you can't safely flip. I now run a dry rollback at the staging stage.
- **Schedule migrations for Tuesday or Wednesday mornings**, not Friday afternoons or pre-holiday weekends. If something goes wrong, you want the new host's support team awake, not on weekend skeleton crew.
- **Tell the client when, not if, you'll be testing.** "I'll flip DNS at 4am Wednesday and the site may have intermittent issues for 30 minutes" sets expectations. "I migrated you, everything's fine, talk soon" is the kind of vague summary that makes 7am panic calls feel personal.
- **Keep a migration log.** Every site I've migrated since 2024 has a Notion doc with what I checked, what broke, what I learned. The 18-step checklist above is a flattened version of that log. Your version will look different.

If you got value from this, the best thing you can do is bookmark this page and run through all 18 items the next time you (or a colleague) migrates a WordPress site. The point of writing this isn't traffic — it's that none of us should have to learn this stuff at 7am from a frantic client.

If you've experienced your own migration disaster, I'd genuinely love to hear it. Reply on whatever platform you found this on. I'll add the lessons to the checklist over time.

The next one's already broken something I haven't written down yet.

— Romail
