---
title: "DNS propagation: how long it really takes"
seoTitle: "DNS Propagation: How Long It Really Takes"
description: "DNS propagation is really just caches expiring on their own clocks. What controls the delay, how long it really takes, and how to check it."
summary: "Nothing is actually pushed anywhere. Every resolver that already holds your old record keeps serving it until its cached copy expires, and the TTL that was on the record before you changed it decides how long that takes. Most visitors see the change within a few hours, and lowering the TTL a day beforehand brings that down to minutes."
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
    a: "DNS propagation is the delay between changing a DNS record and every visitor seeing the change. The name's misleading, because nothing gets pushed anywhere. There's no central system sending your new IP address out to the world's DNS resolvers. Every resolver that already has your old answer just keeps serving it until its cached copy expires, then asks again and gets the new one. So what people call propagation is really thousands of separate caches expiring on their own clocks."
  - q: "How long does DNS propagation take?"
    a: "It depends almost entirely on the TTL that was on the record before you changed it. If you lowered the TTL to 60 seconds at least a day beforehand, most people see the change within a minute or two. If the record was on a default TTL of 3600 seconds, expect about an hour for most visitors. If it was on the old 86400 default, it can take up to a day. The 24 to 48 hours your hosting company quotes is a safety margin to cover the slowest cache in the chain. You aren't actually in a queue."
  - q: "How do I check DNS propagation?"
    a: "Query a few resolvers directly instead of loading the site in your browser, since the browser adds a cache of its own. Run dig @1.1.1.1 example.com and dig @8.8.8.8 example.com to ask two big public resolvers, and dig +trace example.com to watch the lookup travel from the root servers down to your authoritative nameserver. For a worldwide view, whatsmydns.net checks 20 to 50 resolvers at once. Getting different answers from different resolvers is completely normal while a change is working its way through."
  - q: "Can you speed up DNS propagation?"
    a: "You can't force someone else's resolver to drop its cache, and no tool can do it for you. What you can do is lower the TTL on the record at least 24 hours before the change, so every cache in the chain is already refreshing quickly by the time you make it. That one step is the difference between a one minute cutover and an all day one. Once the change is made, the only caches you can really flush are your own: ipconfig /flushdns on Windows, sudo dscacheutil -flushcache on macOS, and chrome://net-internals/#dns in Chrome."
  - q: "Why does DNS propagation take 24 to 48 hours?"
    a: "Usually it doesn't. The figure dates back to the 1990s and early 2000s, when common TTL defaults were 86400 seconds (24 hours) or 172800 (48 hours). These days actively managed records usually sit between 60 and 3600 seconds, but the advice never got updated. It hangs around because it's a wide enough window that most support tickets sort themselves out before anyone chases them, and because there really is a long tail of badly behaved caches that ignore published TTLs."
  - q: "Why do different DNS checkers show different results?"
    a: "Because each checker queries from a different place, asking a different resolver, and each of those has its own cache. Tools like whatsmydns.net check 20 to 50 resolvers around the world. If some show the new IP and some still show the old one, that's expected. It just means some caches have expired and some haven't yet. Once the TTL has run out on every cache in the chain, they'll all agree."
  - q: "What is the difference between DNS TTL and propagation?"
    a: "TTL, short for Time To Live, is a number on every DNS record that tells caches how many seconds to hold the answer before asking again. Propagation is the everyday name for the time between making a change and everyone being able to see it. A low TTL makes propagation feel quick, because caches refresh sooner, and a high TTL makes it feel slow. TTL is the part you control, and propagation is what you experience as a result."
---

DNS propagation is the delay between changing a DNS record and everyone being able to see the change. The name's a bit misleading, because nothing actually propagates.

Most people want the short answer, so here it is. If you lowered the TTL on the record to 60 seconds a day beforehand, the change reaches most people within a minute or two. If the record was sitting on a default TTL of 3600, expect roughly an hour. The 24 to 48 hours your hosting company quotes is a safety margin to cover the slowest cache in the chain. You aren't waiting in some queue.

The longer answer is worth reading, though, because it tells you which part of that delay you can control and which part you can't.

## What DNS propagation actually is

There's no central registry pushing your A record out to the world's resolvers, and no batch job at 4am updating the internet's address book. DNS is pull based. Nothing gets sent anywhere.

Someone finds out about your record change because something on their end asks for it: their browser, their operating system, or their ISP's resolver. When that question gets asked depends on whether anything along the way still holds a cached answer, and how long it was told to keep it.

That instruction is the TTL, a number of seconds attached to the record by whoever runs the DNS zone. A resolver that fetched your record with a TTL of 3600 will keep handing out the old answer for up to an hour, whatever you've changed since, and however badly you need it gone.

So what people call propagation is thousands of separate caches spread across resolvers and devices, each expiring at a slightly different moment depending on when it first cached the record and what TTL it was given. There's never a clean cutover. Two visitors arriving five minutes after your change can land on two different servers, and both of their setups are behaving exactly as designed.

## How long does DNS propagation take?

That comes down almost entirely to the TTL that was on the record *before* you changed it. The one you set afterwards barely matters. By the time you make the change, every cache already holding your record is counting down on the old value.

| TTL before the change | Most visitors see the new record within |
| --- | --- |
| 60 seconds | 1 to 2 minutes |
| 300 seconds | About 5 minutes |
| 3600 seconds (common default) | About 1 hour |
| 14400 seconds | About 4 hours |
| 86400 seconds (old default) | Up to 24 hours |

Those figures cover most of your traffic, though there's always a tail: a corporate resolver with a hard minimum TTL, an ISP that caps everything at four hours, a phone that hasn't switched networks in a week. That tail is why the 24 to 48 hour advice sticks around, even though it has nothing to do with how DNS actually works.

In practice, the most important step happens a day before the migration. Lower the TTL to 60 seconds at least 24 hours ahead, and every cache upstream spends that day refreshing on a short clock. Then when you flip the record, they come back for the new answer within about a minute.

Miss that step and you're stuck with whatever the old TTL was, and there's no way to shorten it after the fact.

## How DNS actually resolves a domain

A single lookup passes through a chain of stops, and there's a cache at each one.

1. **Browser DNS cache.** Chrome's lasts roughly a minute by default. Firefox respects published TTLs more closely. Native mobile apps often keep their own caches that bypass the operating system altogether.

2. **OS DNS cache.** macOS uses `mDNSResponder`, modern Linux usually uses `systemd-resolved`, and Windows uses the DNS Client service. These respect the TTL on the answers they get, though some enforce a minimum.

3. **Local network resolver.** This is usually whatever your network handed you: your home router, your office gateway or your ISP. It has its own cache and doesn't always respect the published TTL. Some ISPs cap TTLs at four hours regardless of what the record says, and corporate networks running BIND, Unbound, pfSense or Pi-hole all make their own decisions.

4. **Recursive resolution up the tree.** With nothing cached, the resolver works its way up: root server, then the TLD server for `.com` or `.io`, then your authoritative nameserver, and back down. That walk takes milliseconds, and the answer gets cached for whatever TTL it came with.

5. **DoH and DoT resolvers.** Browsers using DNS over HTTPS skip your local resolver completely. Firefox uses Cloudflare by default, and Chrome on Android often uses Google. These run their own caches, shared across millions of devices.

So the 24 to 48 hour figure is really just how long the slowest link in that chain takes to let go of its copy. That's usually a third party resolver capping TTL at a day, or a corporate resolver set up years ago by someone who's since left.

## Why the 24 to 48 hour number stuck

The number's an oversimplification more than an outright error, and there are a few reasons it's survived this long.

Old TTL defaults are the main one. Back in the 1990s and early 2000s, common TTLs were 86400 or 172800 seconds, and anyone who learned DNS then took those numbers as the window. Actively managed records now usually sit between 60 and 3600, but the advice never caught up.

Some ISPs also used to flush their caches in a daily batch. Change your record just before one and it felt instant. Change it just after and it felt like a full day. From the outside, the delay looked completely random.

It also closes support tickets. If a customer changes DNS and complains straight away, the cheapest answer is to tell them to wait 24 to 48 hours. By then the problem has usually fixed itself or stopped mattering, and as support economics go, that's hard to beat.

And the long tail is real. Even with sensible TTLs, there's always one cache somewhere that won't update for a day, and the polite fiction covers that without anyone having to explain it.

So it's a load bearing approximation. The trouble starts when you take it literally and plan your migration around waiting it out.

## What actually controls when your change is visible

There are five layers, ordered from the one you control to the ones you really don't.

### Layer 1: TTL on your record (you control this)

This is the only dial you can actually turn. Set it to 60 seconds at least 24 hours before the change, flip the record, then raise it back to 3600 or higher once the new server has been stable for a couple of days. Leaving it on 60 forever just adds unnecessary query load and latency.

### Layer 2: Your authoritative nameservers (mostly out of your control)

Your DNS provider might not push changes across its own servers instantly. Cloudflare and Route 53 are effectively immediate, but some smaller registrars take one to five minutes for a change made in the admin panel to show up on all their nameservers. Give it two minutes, then check with `dig +trace example.com` before you go looking for a bigger problem.

### Layer 3: ISP and public resolver caches (out of your control)

The big public resolvers, Cloudflare on 1.1.1.1, Google on 8.8.8.8 and Quad9 on 9.9.9.9, respect TTLs well. ISP resolvers are more of a mixed bag. Some respect the published value, some cap it, and some have quirks you'll only find written up in an old forum thread. Corporate resolvers do whatever their IT team set up, which often isn't what the record asked for.

### Layer 4: Browser DNS caches (out of your control)

Chrome's lasts about a minute, Safari's is similar, and Firefox respects TTLs more closely. It's a small layer but the most noticeable one: "it works on my phone but not in this tab" is nearly always a stale browser cache. Clearing it at `chrome://net-internals/#dns` fixes it for that person, in that browser, one time.

### Layer 5: DNS over HTTPS providers (out of your control)

A browser using DoH goes around both the ISP resolver and the corporate one, talking straight to a third party. That's why asking a client's IT team to flush their cache sometimes changes nothing at all. They control the corporate resolver, but the browser is talking to Cloudflare, and nobody at the company knows.

## How to check DNS propagation

Don't test by loading the site in your browser. That adds two more caches, your browser's and your operating system's, on top of the resolver you're actually trying to look at. Query resolvers directly instead.

```
# Ask two large public resolvers what they currently hold
dig @1.1.1.1 example.com +short
dig @8.8.8.8 example.com +short

# Watch the full walk from the root servers down
dig +trace example.com

# Ask your authoritative nameserver directly, bypassing every cache
dig @ns1.yourprovider.com example.com +short
```

If you're on Windows without `dig`, `nslookup example.com 1.1.1.1` will get you most of the way.

That last command is the one that matters most during a migration. Your authoritative nameserver is the source of truth, so if it returns the new IP, your change is live and everything after that is just caching. For a worldwide picture, [whatsmydns.net](https://www.whatsmydns.net) queries 20 to 50 resolvers at once.

Expect them to disagree for a while. Mixed results are completely normal partway through a TTL window.

## Can you speed up DNS propagation?

Once the change is made, no, and no tool can either. You can't reach into someone else's resolver and expire their cache. Anything promising to force global propagation is really just a checker with a refresh button.

What does work is preparation. Lowering the TTL 24 hours ahead is really the whole game, and it's the difference between a one minute cutover and an all day one.

The only caches you can actually flush are your own:

- **Windows:** `ipconfig /flushdns`
- **macOS:** `sudo dscacheutil -flushcache` then `sudo killall -HUP mDNSResponder`
- **Linux (systemd):** `sudo resolvectl flush-caches`
- **Chrome:** visit `chrome://net-internals/#dns` and clear the host cache

That's useful for checking your own work, and no help at all for the client whose office resolver is the actual problem. The full set of commands, including Firefox, iPhone and Android, is in [how to flush DNS](/blog/how-to-flush-dns).

## What to do instead of waiting

Once you accept that the delay is just caches expiring, your migration process changes. You stop waiting, and you test the new server while DNS still points at the old one.

I should be upfront about a conflict of interest here: I built a free tool for this. [DNS Previewer](https://dnspreviewer.com) creates a temporary subdomain that proxies your new server using the correct Host header and TLS SNI for your real domain, so the server responds exactly as it will after the change. You can open it on any device before touching a record. [SkipDNS](https://skipdns.link) is the established paid tool that does the same job, and I keep an [honest comparison of the two](/vs-skipdns), including the parts where theirs is better. Editing your hosts file works too, with [limitations worth knowing](/blog/preview-website-new-server-without-hosts-file).

Here's the process itself:

- Lower the TTL to 60 seconds at least 24 hours before the migration. It's the most important thing you control, and the only one you can't fix later.
- Test the new server under your real domain before changing any records, so vhost and certificate problems turn up before your visitors find them. Certificates are the awkward one here, because most authorities want the hostname pointing at the new machine before they will issue one, which is the [deadlock behind ERR_SSL_PROTOCOL_ERROR](/blog/err-ssl-protocol-error) on a fresh server.
- Flip the record once the new server responds correctly. The cutover itself should feel boring.
- Don't rely on a single checker. Test from the client's actual network too, since that's where stale cache problems tend to hide.
- Raise the TTL back to 3600 or higher after 48 stable hours.
- Write down the old IP and test your rollback before you need it at 4am.

Waiting to see what happens is how you end up with the 3am phone call. Testing before you flip catches the same problems without any of your visitors being involved.

## The short version

There's no single process running somewhere that you can check the status of. DNS propagation is the sum of every cache between your record and your visitor, each expiring on its own clock, with TTL as the only input you control.

Set a low TTL a day in advance, check the new server before you change anything, query resolvers directly instead of reloading a browser tab, and accept that the long tail of stale caches is nobody's fault. That's simply how the protocol was designed to work.

Once you understand what's actually going on, you stop waiting for it.
