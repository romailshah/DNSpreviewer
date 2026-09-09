---
title: "DNS propagation: how long it really takes"
seoTitle: "DNS Propagation: How Long It Really Takes"
description: "DNS propagation is not a wave crossing the internet, it is caches expiring. What controls the delay, how long it really takes, and how to check it."
publishedAt: "2026-06-16"
updatedAt: "2026-09-09"
author: "Romail Shah"
authorBio: "Romail Shah is a full-stack developer and the founder of DNS Previewer, a free tool for checking a website on a new server before you change DNS. He builds and migrates client sites for a living."
category: "DNS"
tags: ["dns", "propagation", "ttl", "migration", "devops", "sysadmin"]
keywords:
  [
    "dns propagation",
    "how long does dns propagation take",
    "what is dns propagation",
    "dns propagation time",
    "how to check dns propagation",
    "how to speed up dns propagation",
    "dns propagation how long",
    "force dns propagation",
    "dns ttl",
  ]
faqs:
  - q: "What is DNS propagation?"
    a: "DNS propagation is the delay between changing a DNS record and every visitor seeing the change. The name is misleading, because nothing is pushed anywhere. There is no central system that distributes your new IP address to the world's DNS resolvers. Instead, every resolver that already has your old answer keeps serving it until its cached copy expires, then asks again and gets the new one. What people call propagation is really thousands of independent caches expiring on their own clocks."
  - q: "How long does DNS propagation take?"
    a: "It depends almost entirely on the TTL that was on the record before you changed it. If you lowered the TTL to 60 seconds at least a day in advance, most people see the change within a minute or two. If the record was sitting on a default TTL of 3600 seconds, expect about an hour for most visitors. If it was on an old 86400 default, expect up to a day. The 24 to 48 hours your hosting company quotes is a safety margin that covers the slowest cache in the chain, not a queue you are waiting in."
  - q: "How do I check DNS propagation?"
    a: "Query several resolvers directly rather than loading the site in your browser, which adds its own cache. Use dig @1.1.1.1 example.com and dig @8.8.8.8 example.com to ask two large public resolvers, and dig +trace example.com to watch the full walk from the root servers down to your authoritative nameserver. For a global view, whatsmydns.net queries 20 to 50 resolvers around the world at once. Different results from different resolvers are normal and expected, not a sign that something is broken."
  - q: "Can you speed up DNS propagation?"
    a: "You cannot force someone else's resolver to drop its cache, and no tool can. What you can do is lower the TTL on the record at least 24 hours before the change, so that every cache in the chain is already refreshing quickly by the time you make it. That single step is the difference between a one minute cutover and an all day one. After the change, the only caches you can genuinely flush are your own: ipconfig /flushdns on Windows, sudo dscacheutil -flushcache on macOS, and chrome://net-internals/#dns in Chrome."
  - q: "Why does DNS propagation take 24 to 48 hours?"
    a: "Usually it does not. The number is a holdover from the 1990s and early 2000s, when common TTL defaults were 86400 seconds (24 hours) or 172800 (48 hours). Modern practice for actively managed records is 60 to 3600 seconds, but the advice never updated. It survives because it is a wide enough window that most support tickets resolve themselves before anyone follows up, and because there is genuinely a long tail of badly behaved caches that ignore published TTLs."
  - q: "Why do different DNS checkers show different results?"
    a: "Because each checker queries from a different physical location, asking a different resolver, each with its own cache. Tools like whatsmydns.net check 20 to 50 resolvers around the world. If some show the new IP and some show the old one, that is expected. It means some caches have expired and some have not. Once the TTL has elapsed on every cache in the chain, they all agree."
  - q: "What is the difference between DNS TTL and propagation?"
    a: "TTL, or Time To Live, is a numeric field on every DNS record telling caches how many seconds to hold the answer before asking again. Propagation is the colloquial name for the time between making a change and that change being visible to everyone. A low TTL makes propagation feel fast because caches refresh sooner. A high TTL makes it feel slow. TTL is the thing you control. Propagation is the experience that results from it."
---

DNS propagation is the delay between changing a DNS record and everyone being able to see the change. The name is misleading, because nothing actually propagates.

Here is the short answer, since that is what most people came for. If you lowered the TTL on the record to 60 seconds a day beforehand, the change reaches most people within a minute or two. If the record was sitting on a default TTL of 3600, expect roughly an hour. The 24 to 48 hours your hosting company quotes is a safety margin covering the slowest cache in the chain, not a queue you are sitting in.

The longer answer is worth reading, because it tells you which part of that delay you control and which part you do not.

## What DNS propagation actually is

There is no central registry pushing your A record out to the world's resolvers. There is no batch job at 4am updating the internet's address book. DNS is pull based. Nothing is sent anywhere.

The way somebody learns about your record change is that something on their side asks for it. Their browser, their operating system, their ISP's resolver. When that question gets asked depends on whether anyone in the chain still holds a cached answer, and how long they were told to hold it.

That instruction is the TTL, a number of seconds attached to the record by whoever runs the DNS zone. A resolver that fetched your record with a TTL of 3600 will keep serving the old answer for up to an hour, no matter what you changed in the meantime, and no matter how urgently you need it gone.

So what people call propagation is thousands of independent caches, scattered across resolvers and devices, each expiring at a slightly different moment depending on when it first cached the record and what TTL it was handed. **There is no clean cutover.** Two visitors arriving five minutes after your change can reach two different servers, and both are behaving correctly.

## How long does DNS propagation take?

Almost entirely down to the TTL that was on the record *before* you changed it. Not the one you set afterwards. By the time you make the change, every cache already holding your record is counting down using the old value.

| TTL before the change | Most visitors see the new record within |
| --- | --- |
| 60 seconds | 1 to 2 minutes |
| 300 seconds | About 5 minutes |
| 3600 seconds (common default) | About 1 hour |
| 14400 seconds | About 4 hours |
| 86400 seconds (old default) | Up to 24 hours |

Those figures cover the bulk of traffic, not every last visitor. There is always a tail: a corporate resolver with a hard TTL floor, an ISP that caps everything at four hours, a phone that has not changed networks in a week. The tail is why the 24 to 48 hour advice persists even though the mechanism has nothing to do with it.

The practical consequence is that the most important step happens a day before the migration, not during it. Lower the TTL to 60 seconds at least 24 hours ahead, and every upstream cache spends that day refreshing on a short clock. Then when you flip the record, they come back for it within about a minute.

Miss that step and you inherit whatever the old TTL was, with no way to shorten it after the fact.

## How DNS actually resolves a domain

Here is the cascade a single lookup passes through, and the cache sitting at each stop.

1. **Browser DNS cache.** Chrome's is roughly a minute by default. Firefox respects published TTLs more carefully. Native mobile apps frequently keep their own caches that bypass the OS entirely.

2. **OS DNS cache.** macOS uses `mDNSResponder`, modern Linux usually `systemd-resolved`, Windows the DNS Client service. These respect the TTL of the response they received, though some enforce minimum TTL floors.

3. **Local network resolver.** Usually whatever your DHCP lease handed you: your home router, your office gateway, your ISP. It has its own cache and does not always respect the published TTL. Some ISPs hard cap TTLs at four hours regardless of what the authoritative record says. Corporate networks running BIND, Unbound, pfSense or Pi-hole each make their own decisions.

4. **Recursive resolution up the tree.** With no cached answer, the resolver walks up: root server, then TLD server for `.com` or `.io`, then your authoritative nameserver, then back down. The walk takes milliseconds. The answer goes into the cache for whatever TTL it carried.

5. **DoH and DoT resolvers.** Browsers running DNS over HTTPS bypass your local resolver completely. Firefox uses Cloudflare by default. Chrome on Android often uses Google. These run their own caches, shared across millions of devices.

The 24 to 48 hour figure is really the time for the slowest layer in that chain to give up its copy. Usually a third party resolver capping TTL at a day, or a corporate resolver configured years ago by someone who has since left.

## Why the 24 to 48 hour number stuck

It is not wrong so much as the wrong abstraction, and there are a few reasons it survived.

**Old TTL defaults.** In the 1990s and early 2000s, common TTLs were 86400 or 172800 seconds. Anyone who learned DNS then internalised those numbers as the window. Modern practice for actively managed records is 60 to 3600, but the advice never caught up.

**ISP cache flush schedules.** Some legacy ISPs ran batch cache flushes on a daily cycle. Change your record just before one and propagation felt instant. Change it just after and it felt like a full day. From the outside, the delay looked random.

**It closes tickets.** If a customer changes DNS and immediately complains, the cheapest possible answer is to wait 24 to 48 hours. By hour 24 the problem has usually either resolved itself or stopped mattering. As support economics go, it is hard to beat.

**The long tail is real.** Even with sensible TTLs, there is always one cache somewhere that will not update for a day. The polite fiction acknowledges that without having to explain it.

So it is a load bearing approximation. The trouble starts when you take it literally and build your migration plan around waiting it out.

## What actually controls when your change is visible

Five layers, ordered from the one you control to the ones you really do not.

### Layer 1: TTL on your record (you control this)

The only knob you can genuinely turn. Set it to 60 seconds at least 24 hours before the change, flip the record, then raise it back to 3600 or higher once the new server has been stable for a couple of days. Leaving it at 60 forever adds unnecessary query load and latency.

### Layer 2: Your authoritative nameservers (mostly out of your control)

Your DNS provider may not push changes between its own server farms instantly. Cloudflare and Route 53 are effectively immediate. Some smaller registrars take one to five minutes for an admin panel change to appear on all their nameservers. Wait two minutes, then confirm with `dig +trace example.com` before you go hunting for a bigger problem.

### Layer 3: ISP and public resolver caches (out of your control)

The large public resolvers, Cloudflare on 1.1.1.1, Google on 8.8.8.8, Quad9 on 9.9.9.9, respect TTLs well. ISP resolvers vary. Some respect the published value, some cap it, some have quirks you will only find documented in an old forum thread. Corporate resolvers do whatever their IT team configured, which is often not what the record asked for.

### Layer 4: Browser DNS caches (out of your control)

Chrome's is about a minute, Safari's similar, Firefox respects TTLs more carefully. Small, but the most visible layer: "it works on my phone but not in this tab" is nearly always a stale browser cache. Clearing it at `chrome://net-internals/#dns` fixes it for that person, in that browser, once.

### Layer 5: DNS over HTTPS providers (out of your control)

A browser using DoH bypasses both the ISP resolver and the corporate one, talking straight to a third party endpoint. This is why asking a client's IT team to flush their cache sometimes changes nothing at all. They control the corporate resolver. The browser is talking to Cloudflare, and nobody at the company knows about it.

## How to check DNS propagation

Do not test by loading the site in your browser. That adds two more caches, the browser's and your operating system's, on top of the resolver you are trying to inspect. Query resolvers directly instead.

```
# Ask two large public resolvers what they currently hold
dig @1.1.1.1 example.com +short
dig @8.8.8.8 example.com +short

# Watch the full walk from the root servers down
dig +trace example.com

# Ask your authoritative nameserver directly, bypassing every cache
dig @ns1.yourprovider.com example.com +short
```

On Windows without `dig`, `nslookup example.com 1.1.1.1` gets you most of the way.

That last command is the useful one during a migration. Your authoritative nameserver is the source of truth. If it returns the new IP, your change is live and everything after that is caching. For a global picture, [whatsmydns.net](https://www.whatsmydns.net) queries 20 to 50 resolvers at once.

Expect disagreement between them. Mixed results are the normal state partway through a TTL window, not a fault.

## Can you speed up DNS propagation?

Not after the fact, and no tool can. You cannot reach into someone else's resolver and expire their cache. Anything claiming to force global propagation is selling you a checker with a refresh button.

What genuinely works is preparation. Lowering the TTL 24 hours ahead is the entire game, and it is the difference between a one minute cutover and an all day one.

The only caches you can actually flush are your own:

- **Windows:** `ipconfig /flushdns`
- **macOS:** `sudo dscacheutil -flushcache` then `sudo killall -HUP mDNSResponder`
- **Linux (systemd):** `sudo resolvectl flush-caches`
- **Chrome:** visit `chrome://net-internals/#dns` and clear the host cache

Useful for confirming your own work. Useless for the client whose office resolver is the actual problem.

## What to do instead of waiting

Once you accept that the delay is caches expiring rather than a process completing, the migration playbook changes. You stop waiting and start testing the new server while DNS still points at the old one.

I should be upfront about a conflict of interest here: I built a free tool for this. [DNS Previewer](https://dnspreviewer.com) generates a temporary subdomain that proxies your new server using the correct Host header and TLS SNI for your real domain, so the server responds exactly as it will after the change. You can open it from any device before touching a record. [SkipDNS](https://skipdns.link) is the established paid tool doing the same job, and I keep an [honest comparison of the two](/vs-skipdns) including the parts where theirs is better. Editing your hosts file also works, with [limitations worth knowing](/blog/preview-website-new-server-without-hosts-file).

The playbook itself:

- **Lower TTL to 60 seconds at least 24 hours before the migration.** The single most important variable you control, and the only one you cannot fix later.
- **Test the new server under your real domain's behaviour** before any record change, so vhost and certificate mismatches surface before production does.
- **Flip the record once the new server responds correctly.** The cutover should feel boring.
- **Do not trust a single checker.** Test from the client's actual network too, since that is where stale cache problems hide.
- **Raise TTL back to 3600 or higher after 48 stable hours.**
- **Write down the old IP and test your rollback** before you need it at 4am.

Waiting and seeing is what produces the 3am phone call. Testing before flipping catches the same problems without involving anyone's visitors.

## The short version

DNS propagation is not a process running somewhere that you can check the status of. It is the sum of every cache between your record and your visitor, each expiring on its own clock, with TTL as the only input you control.

Set a low TTL a day in advance, verify the new server before you change anything, query resolvers directly rather than reloading a browser tab, and accept that the long tail of stale caches is not anyone's fault. It is how the protocol was designed to work.

Once you understand what is actually happening, you stop waiting for it.
