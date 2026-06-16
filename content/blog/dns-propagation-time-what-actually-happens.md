---
title: "I've never met a senior sysadmin who believes in DNS propagation. Here's the version they tell each other."
seoTitle: "DNS Propagation Time: What Actually Happens When You Change DNS Records"
description: "Your hosting company says 'wait 24-48 hours for DNS propagation.' That's not how DNS works — and the real mechanism explains why your migration broke at 3am."
publishedAt: "2026-06-16"
author: "Romail Shah"
authorBio: "Romail Shah is a full-stack developer and founder of DNS Previewer — a free tool for previewing websites on new servers before flipping DNS. He's been migrating sites and arguing with DNS for the better part of a decade."
category: "DNS"
tags: ["dns", "propagation", "ttl", "migration", "devops", "sysadmin"]
keywords: ["dns propagation time", "how long does dns propagation take", "dns propagation", "dns ttl", "dns caching", "dns resolver cache", "dns preview tool", "is dns propagation real", "why is my dns not propagating"]
faqs:
  - q: "How long does DNS propagation actually take?"
    a: "There's no single answer. The TTL on your DNS record sets the upper bound that any cache should hold the old answer before re-asking. If your TTL is 60 seconds and you change the record now, most caches refresh within a minute. But individual caches at ISPs, corporate networks, or browser-level DNS layers may hold stale answers longer — sometimes hours — regardless of what TTL you set. The 24-48 hour advice is a polite catchall for that long tail. In practice, propagation completes in 60-300 seconds if you lowered TTL in advance, with a small tail of weird caches that take longer."
  - q: "Why does DNS propagation take so long?"
    a: "It doesn't, technically. What takes long is the slowest cache in the resolution chain expiring its old answer. Each DNS resolver — your ISP's, your corporate IT's, third-party services like 8.8.8.8 and 1.1.1.1, your browser's internal cache — independently decides when to refresh based on the TTL field on the record. Most caches respect TTL within seconds. A few legacy or hard-coded caches don't. Your total 'propagation time' is dominated by the slowest cache, not the fastest, which is why the experience feels random."
  - q: "Can you speed up DNS propagation?"
    a: "Partially. You can't force someone else's cache to refresh, but you CAN control the TTL on your own records — lower it to 60 seconds at least 24 hours before a change so upstream caches refresh more aggressively in the lead-up. You can also bypass the wait entirely by testing the new server's behavior under your domain BEFORE flipping the record. A DNS preview tool does this; so does editing /etc/hosts locally for one machine. Once you confirm the new server responds correctly, the actual cutover is anticlimactic."
  - q: "Why is my DNS not propagating?"
    a: "Most of the time, it has propagated — somewhere. The real question is 'where is the cache that hasn't refreshed yet?' Common culprits: your client's corporate IT runs its own resolver with a hard-capped TTL of 24 hours, your own browser has a stale DNS cache (clear at chrome://net-internals/#dns), or your ISP's resolver respects TTLs poorly. Verify by checking from multiple networks using https://whatsmydns.net — if some regions show the new IP and some show the old, it's specific stale caches, not 'incomplete propagation.'"
  - q: "What's the difference between DNS TTL and propagation?"
    a: "TTL (Time To Live) is a numeric field on every DNS record that tells caches 'hold this answer for N seconds before re-asking.' Propagation is the colloquial term for the time between making a change and that change being visible to everyone. They're related: a low TTL makes propagation feel fast (because caches refresh faster), a high TTL makes it feel slow. TTL is what you control. 'Propagation' is the user-facing experience that results."
  - q: "How can I test a DNS change before it propagates?"
    a: "Three options, in order of how cleanly they work. Best: a DNS preview tool like DNS Previewer or skipdns.link that generates a temporary URL reverse-proxying your new server with the correct Host header and TLS SNI for your real domain. You can hit the preview from any device, anywhere, before changing actual records. Decent: edit /etc/hosts to map your domain to the new IP — works only on your machine. Bad but common: hit the new server's raw IP directly — the vhost config probably won't respond correctly without the right Host header."
  - q: "Why do different DNS checkers show different results?"
    a: "Because each DNS checker queries from a different physical location, asking a different DNS resolver, which has its own cache. Tools like whatsmydns.net check 20-50 resolvers around the world. If some show the new IP and some show the old, that's expected — not a sign of 'incomplete propagation.' It's a sign that some caches have refreshed and some haven't. Within a few hours of TTL expiring on every cache in the chain, they all show the same IP."
---

Wednesday morning, a client asked me whether her site had "finished propagating yet."

I'd flipped DNS at 6am. By 9am she was on Slack — polite, but pointed, in that way that means a manager is asking — wanting an ETA. Could I check the propagation status? Was 24 hours the right wait? What about 48? Her old web guy used to say it could take up to 72.

The honest answer was: it's already done. It was done within about 90 seconds. The reason her IT team couldn't reach the new site was that their office DNS resolver was a Pi-hole someone had configured in 2019 with a 7-day cache flush. It had nothing to do with "propagation."

But I didn't say that. I said something like "sometimes there's a tail, let me confirm." Because explaining DNS to a non-technical client during an active outage is a bad use of everyone's time.

This post is the version we don't say out loud.

## DNS doesn't propagate. That's not how it works.

There is no central registry pushing your A record to the world's resolvers. There is no batch job at 4am that updates "the internet's address book." When tech support tells you to "wait 24-48 hours for DNS to propagate," they are using a polite fiction that covers for a much weirder reality.

I've been doing infrastructure work for the better part of a decade — debugging "DNS issues" that aren't really DNS issues, explaining to project managers why the site is back for me but still broken for their team. And every time I've talked to someone with serious DNS chops about how they explain propagation to clients, they've all said some version of the same thing: we lie. Politely.

We say "propagation" because the truth involves TTL fields, recursive resolver caching, browser-level DNS pinning, OS-level DNS caching, and at least three different layers of corporate / ISP / mobile carrier infrastructure that absolutely don't update on any predictable schedule. The actual mechanism is genuinely chaotic. The "24-48 hours" advice is a wide enough window that almost nobody complains.

Let me get specific. Here's what actually happens when you change an A record, why your client's IT team will be the last to see the change, and why I no longer "wait for propagation" before launching production websites.

(Spoiler: I built a free tool for this. But that's not the point of this post.)

## How DNS actually resolves a domain

The first thing to understand is that DNS is **pull-based**.

There is no system, anywhere, that knows about every A record in the world and pushes updates to caches. The way someone finds out about my A record change is that something on their side — their browser, their OS, their ISP's resolver — asks for it.

When that question gets asked depends on whether anyone in the chain still has a cached answer. And how long they keep that cached answer depends on a value called **TTL** (Time To Live), which is set on the record itself by whoever owns the DNS zone.

Here's the cascade in more detail:

1. **Browser DNS cache.** Chrome's cache, for example, is roughly 1 minute by default. Firefox respects published TTLs more carefully. Native mobile apps frequently maintain their own caches that bypass the OS entirely.

2. **OS DNS cache.** macOS uses `mDNSResponder`. Modern Linux is usually `systemd-resolved`. Windows has the DNS Client service. These respect the TTL of the response they got back, though some have minimum-TTL floors.

3. **Local network resolver.** The first DNS resolver your machine asks is usually whatever your DHCP lease handed you — your home router, your office gateway, your ISP. This resolver has its own cache, and it doesn't always respect the published TTL. Some ISPs hard-cap TTLs at, say, 4 hours regardless of what the authoritative record says. Corporate networks running their own resolvers (BIND, Unbound, pfsense, Pi-hole) each make their own decisions.

4. **Recursive resolution up the tree.** If the local resolver doesn't have a cached answer, it walks up: root server → TLD server (`.com`, `.io`, etc.) → your authoritative nameserver, then back down. This walk takes milliseconds. The answer it gets back goes into the cache for the TTL it was given.

5. **DoH and DoT routing around your local resolver.** Modern browsers running DNS-over-HTTPS bypass your local resolver entirely. Firefox uses Cloudflare by default. Chrome on Android often uses Google. These resolvers run their own caches, shared across millions of devices.

So when you "propagate" a DNS change, what's actually happening is: each individual cache, scattered across hundreds of resolvers and millions of devices, gets its cached answer expired at a slightly different time based on when it was originally cached and what TTL it was given. **There is no clean cutover.**

I want to underline that. There is genuinely no clean cutover. Two different visitors hitting your site five minutes after you change DNS may see two completely different servers depending on which resolver they go through and when that resolver last cached the record.

The "24-48 hours" wait is the time it takes for the slowest cache layer in the chain to expire — usually a third-party resolver that hard-caps TTL at 24 hours, or a corporate Pi-hole someone configured in 2019, or your client's grandparent's iPhone connected to their gym's wifi with a captive resolver.

## Why "24-48 hours" became the polite fiction

The 24-48 hour number isn't wrong. It's just the wrong abstraction.

It's wrong in the same way "nothing can go faster than light" is wrong — technically accurate for the situations most people encounter, but the actual mechanism (TTL fields per record, caching at every layer, no central authority) is genuinely interesting and people who care should know it.

Why does support tell you 24-48 hours? A few reasons, stacking up over time:

**Old TTL defaults.** In the 1990s and early 2000s, common TTLs were 86400 seconds (24 hours) or 172800 (48 hours). Anyone who learned DNS in that era internalized those numbers as the relevant window. Modern best practice is TTLs of 60-3600 for actively-managed records, but the "24-48 hours" advice never updated to match.

**ISP cache flushing schedules.** Some legacy ISPs ran batch DNS cache flushes on a daily schedule. If you made a change right before the flush, propagation felt instant. If you made it right after, it felt like 24 hours. From the user's perspective, the delay was random.

**CYA from hosting support.** If a customer changes DNS and immediately complains, the cheapest answer is "wait 24-48 hours." Most of the time, by hour 24, either the issue has been fixed or the customer has stopped caring. The advice resolves 90% of tickets without escalation. It is, from a support-economics standpoint, brilliant.

**A genuinely long tail.** Even with modern TTLs, the long tail of stale caches is hard to nail down. There is always one cache somewhere that won't update for a day. The polite fiction acknowledges this without explaining it.

So the conventional wisdom isn't a lie. It's a load-bearing approximation that papers over the long tail. The problem is when you take it literally and design your migration plan around it.

## What actually controls when your DNS change is visible

If you want to know when your DNS change will actually be visible to a specific person, the answer is: it depends on five layers, listed here from "you control this" to "you really, really don't."

### Layer 1: TTL on your DNS record (you control this)

This is the only knob you can actually turn. The TTL you set tells every cache in the chain how long to hold the answer before re-asking.

The pre-migration play: set your TTL to 60 seconds at least 24 hours before you plan to change the record. This causes every upstream cache to refresh more frequently in the lead-up. Then when you flip the record, those caches re-ask within roughly 60 seconds.

After the change is stable for 48 hours, raise TTL back to 3600 or higher. This reduces unnecessary DNS query load and improves latency for steady-state traffic.

If you forget to lower TTL in advance, your "instant" cutover can leave caches holding stale records for whatever the previous TTL was. If the old TTL was 14400 (4 hours), you've got 4 hours of mixed-traffic state. If it was 86400 (a day), you've got a day.

### Layer 2: Your authoritative nameserver's response time (mostly out of your control)

Your DNS provider's nameservers may not propagate changes between their own server farms instantly. Cloudflare is roughly instant. Route 53 is roughly instant. Some smaller registrars take 1-5 minutes for a change made in the admin panel to actually appear on all their authoritative nameservers.

This is usually not a problem, but it's worth knowing if you're chasing a "why isn't the change live yet?" issue right after making it. Wait two minutes, then `dig +trace @your.nameserver.com example.com` to verify.

### Layer 3: ISP and public resolver caches (out of your control)

Whatever cache your client's office router uses, whatever cache their ISP's resolver uses, whatever cache 8.8.8.8 or 1.1.1.1 has — these update according to their own rules. Most respect TTLs. Some don't.

The big public resolvers (Cloudflare 1.1.1.1, Google 8.8.8.8, Quad9 9.9.9.9) tend to respect TTLs well. ISP resolvers are more variable — some respect the published TTL, some hard-cap it, some have known quirks documented on Stack Overflow if you go looking. Corporate networks running their own resolvers do whatever the IT team configured. Often badly.

You can ask specific resolvers to refresh, but only if you control them. Telling your client's IT team to flush their cache works exactly as well as you'd expect, which is to say sometimes.

### Layer 4: Browser DNS caches (out of your control)

Chrome's DNS cache is roughly 1 minute. Safari's is similar. Firefox respects the TTL more carefully. Native mobile apps often have their own caches with TTLs the OS can't see.

The browser cache is the smallest layer, but it's the most visible — "the site works on my phone but not in this Chrome tab" is almost always Chrome's DNS cache being stale. Visiting `chrome://net-internals/#dns` and clearing the cache works for that user, on that browser, that one time.

### Layer 5: DNS-over-HTTPS providers (out of your control)

If your client's browser is using DoH (Firefox by default, increasingly common in Chrome on Android), they're bypassing both their ISP resolver and their corporate resolver, and going directly to a third-party DoH provider — usually Cloudflare or Google.

This is fine when it works, but it adds another opaque cache layer to the mix. And it's the reason "ask their IT team to flush DNS" sometimes doesn't help at all. The IT team controls the corporate resolver. The user's browser is talking to a Cloudflare endpoint nobody at the company knows about.

## What to do instead of waiting

Once you accept that DNS doesn't "propagate" on a schedule, your migration playbook changes. You stop waiting. You start testing the new server while DNS still points at the old one.

This is the part where I have a conflict of interest, so I'll be upfront: I built a free tool called [DNS Previewer](https://dnspreviewer.com) specifically for this. It generates a temporary subdomain that reverse-proxies your new server with the correct Host header and TLS SNI for your real domain. You can hit it from any device, anywhere, before changing actual DNS records — you see exactly what visitors will see post-flip.

[skipdns.link](https://skipdns.link) is the established paid tool in this space (starts at $9.9/mo; the useful features like password protection are at $39.9/mo). Both work the same way mechanically. Use whichever you prefer. The point is: don't migrate without testing the new server under your actual domain's response behavior. That's the step that catches the kind of vhost-and-SSL mismatch I [wrote about last week](/blog/wordpress-migration-checklist-test-before-dns) — the one that took down a client's site for fourteen hours.

Beyond that, the playbook I run now:

- **Lower TTL to 60 seconds at least 24 hours before the migration.** Don't skip this. It's the single most important variable you control.
- **Test the new server under your domain's behavior** before any record change. Use a DNS preview tool, or `/etc/hosts` if you only need to verify from one machine.
- **Once you're confident the new server responds correctly, flip the DNS record.** The cutover should feel boring.
- **Don't trust any single DNS checker.** [whatsmydns.net](https://www.whatsmydns.net) shows you 20-50 resolvers' views. But also test from your client's actual network — that's where the long tail of stale-cache problems hides.
- **After 48 hours stable, raise TTL back to 3600 or 86400.** Don't leave it at 60 forever; it adds DNS query overhead at scale.
- **Document the old IP, and have a tested rollback procedure.** If you have to revert at 4am, you don't want to be looking up the old IP from email archives.

The "wait and see" approach is what creates the 3am phone call. The "test the new server before flipping" approach catches the same issues without involving production.

## What sysadmins tell each other instead

Senior infrastructure people don't really talk about "DNS propagation" with each other. They talk about TTLs, resolver caches, and where the stale cache that's blocking the client's IT team is hiding. When you hear them say "propagation" in a meeting, they're doing it for the same reason a cardiologist tells you to "watch your salt" instead of explaining the renin-angiotensin system — the simplification is faster than the truth, and almost as useful.

When I explain this to clients, I still use the word "propagation." It's a useful shorthand. But internally, I think of it as a cascade of independent caches, each running its own clock, with TTL as the only thing I can really control. The cleanup is in choosing a good TTL ahead of time, testing the new server before flipping, and accepting that the long tail of stale caches isn't anyone's fault — it's just how the protocol works.

If you've ever been the person on the 7am Slack message saying "let me check the propagation status," the version sysadmins tell each other is more useful and less mysterious than the version we tell clients.

The bonus is that once you understand what's actually happening, you stop waiting for it.

— Romail
