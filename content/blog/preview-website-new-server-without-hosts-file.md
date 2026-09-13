---
title: "How to preview a site on a new server without editing the hosts file"
seoTitle: "Preview a Site on a New Server Without the Hosts File"
description: "The hosts file works on one machine, with admin rights, and never with wildcards. What it does, where it breaks, and how to test a new server without it."
publishedAt: "2026-09-07"
author: "Romail Shah"
authorBio: "Romail Shah is a full-stack developer and the founder of DNS Previewer, a free tool for checking a website on a new server before you change DNS. He builds and migrates client sites for a living."
category: "Migration"
tags: ["hosts file", "dns", "migration", "testing", "windows", "macos"]
keywords:
  [
    "preview website on new server without changing hosts file",
    "hosts file alternative",
    "edit hosts file to test website",
    "test website before changing DNS",
    "hosts file wildcard subdomain",
    "hosts file not working",
    "how to preview a site on a new server",
    "share a test link with a client before DNS",
    "hosts file Firefox DNS over HTTPS",
  ]
faqs:
  - q: "How do I edit the hosts file to test a website on a new server?"
    a: "On Windows the file's at C:\\Windows\\System32\\drivers\\etc\\hosts, and you'll need to open your editor as administrator. On macOS and Linux it's /etc/hosts, and you'll need sudo. Add a line with the new server's IP address, a space or tab, then the hostname, for example 203.0.113.42 example.com. If you use www.example.com, add a second line for it, because the hosts file doesn't cover subdomains automatically. Save it, then flush your DNS cache before you test."
  - q: "Can the hosts file use wildcards for subdomains?"
    a: "No. The hosts file only matches exact hostnames, and there's no way to write *.example.com and have it cover blog.example.com, shop.example.com and the rest. Every hostname needs its own line, and you have to know all of them up front. It's the single biggest limitation when you're migrating a WordPress multisite, or any site with a lot of subdomains."
  - q: "Why is my hosts file not working?"
    a: "Usually one of three things. The first is DNS caching: your operating system or browser is still holding the old answer, so flush it with ipconfig /flushdns on Windows, or sudo dscacheutil -flushcache followed by sudo killall -HUP mDNSResponder on macOS. The second is Firefox with DNS over HTTPS switched on, which resolves names inside the browser and skips the operating system, and the hosts file with it. Chrome behaves differently and usually still honours the file, because it checks the system resolver for local entries. The third is that the file was saved without administrator rights, so your change never actually reached the disk."
  - q: "Can I share a hosts file change with a client?"
    a: "Not directly. A hosts file entry only affects the machine it was saved on. For a client to see the new server, you'd have to talk them through editing a protected system file with administrator rights on their own computer, which is a lot to ask and often blocked outright on managed work laptops. That's usually the point where people start looking for an alternative."
  - q: "Can I edit the hosts file on an iPhone or Android phone?"
    a: "Not without jailbreaking or rooting the device, and you shouldn't do that to a work phone. There's no supported way to add a hosts entry on a stock iPhone or Android device. That rules out checking a migration on the very screens where layout and touch problems tend to show up."
  - q: "What is the difference between a hosts file entry and a DNS preview link?"
    a: "Both get a browser talking to the new server while still showing it your real domain name, so the server picks the right virtual host and the right certificate. The difference is who can use it. A hosts file entry works on the one machine you had administrator access to. A DNS preview link is a URL, so it works for your client, your colleague, your phone and anyone else you send it to, without them setting anything up."
---

Every migration ends up in the same spot. The files are on the new server, the database is imported, and now you've got to work out whether it actually works before you point DNS at it and find out in public.

The usual answer is to edit your hosts file. It's a good answer. It's also older than DNS itself, and it has limits that are easy to forget until they bite.

## What editing the hosts file actually does

Before your computer asks a DNS server where `example.com` lives, it checks a plain text file on disk. If that file has a line for the hostname, the lookup stops right there and nothing goes out over the network.

You'll find it here:

- **Windows:** `C:\Windows\System32\drivers\etc\hosts`
- **macOS and Linux:** `/etc/hosts`

Both are protected system files. On Windows you need to run your editor as administrator, and on macOS or Linux you need `sudo`.

It's one mapping per line, with the IP address first:

```
203.0.113.42    example.com
203.0.113.42    www.example.com
```

The reason this trick works at all comes down to what your browser sends. It still sends `Host: example.com` in the request, and the TLS handshake still carries `example.com` as the SNI value. So the new server sees the real domain name, picks the right virtual host and serves the right certificate, exactly as it would after a real DNS change.

That's why editing the hosts file beats typing the server's IP address into the address bar. If you visit `http://203.0.113.42` directly, the browser sends `Host: 203.0.113.42`, and the server has no idea which site you're after. You get the default virtual host, which is usually an Apache welcome page, a 404, or someone else's website on the same box. People see that and assume the migration failed. It didn't. They just asked the wrong question.

So the hosts file gets the technical part right. Its problems are all practical ones.

## Where the hosts file runs out of road

### It only works on the machine you edited

This is the biggest problem by far. A hosts entry is local. Your client can't see what you see, your colleague can't either, and there's no way to email it to anyone.

To bring even one other person along, you'd have to walk them through opening a protected system file with administrator rights on their own computer. On a managed work laptop that's often blocked by policy, so no amount of patience on the call is going to get you there.

### There are no wildcards

The hosts file matches exact hostnames, and there's no syntax for `*.example.com`. If you're migrating a WordPress multisite, or anything with `blog.`, `shop.`, `app.` and a few others, you need a line for every single one, and you need the full list before you start.

Miss one and you get a confusing, half-broken result, where some of the site comes from the new server and some quietly comes from the old one.

### Phones and tablets are out

There's no supported way to edit the hosts file on a stock iPhone or Android device. Unless you root or jailbreak it, you simply can't test on mobile this way.

That hurts more than it sounds, because mobile is where layouts break, where buttons end up too close together, and where a slow new server is most obvious.

### Firefox may ignore it completely

Firefox enables DNS over HTTPS, which looks names up inside the browser over an encrypted connection to a DNS provider. When that's on, the lookup never reaches your operating system, so your hosts file gets skipped entirely. Your entry can be correct and saved and still be completely ignored.

Mozilla has been tracking support for local address overrides under DoH in [bug 1453207](https://bugzilla.mozilla.org/show_bug.cgi?id=1453207) for years. Chrome behaves differently here and generally still honours the file, because it checks the system resolver for local entries. That's why the same test can pass in one browser and fail in another on the same machine.

If you're relying on the hosts file, check whether DoH is switched on before you draw any conclusions about the server.

### Caches will lie to you for a while

Editing the file doesn't clear what your system already remembers:

- **Windows:** `ipconfig /flushdns`
- **macOS:** `sudo dscacheutil -flushcache` then `sudo killall -HUP mDNSResponder`
- **Chrome, separately:** visit `chrome://net-internals/#dns` and clear the host cache

Skip this and you can easily lose twenty minutes debugging a server that was fine all along. The commands for Linux, Firefox and phones are in [how to flush DNS](/blog/how-to-flush-dns).

### You have to remember to take it out

A forgotten hosts entry makes for a really nasty bug. You finish the migration, DNS changes properly, everyone moves on, and your own machine keeps pointing at the old IP because the line never got removed.

Weeks later the site looks frozen or broken, but only for you, and nobody else can reproduce it. It's the kind of problem that can swallow a whole afternoon before anyone thinks to check.

## How to preview a site on a new server without touching the hosts file

The alternative is to take the same trick off your machine and put it behind a URL.

A preview link works as a reverse proxy. You give it your domain and the new server's IP address, and it hands you back a link on a subdomain, something like `x7k3p.dnspreviewer.com`. When you open that link, the proxy connects to your new server and sends `Host: example.com` along with it, plus the matching SNI on the TLS connection.

So the new server sees the same request it would after a real DNS change. You get the right virtual host and the right certificate behaviour, which is the whole point of the hosts file trick, only now it's a link.

That one change fixes most of the list above in one go. You can send a link to a client. It works on a phone without any setup. It doesn't need administrator rights, it doesn't matter whether someone's using Firefox with DoH, and there's nothing left behind on anyone's machine to forget about.

Wildcards stop being a problem too, because the proxy can cover a whole domain and all its subdomains, so you're not listing them out by hand.

[DNS Previewer](/) does this for free, wildcards included. You can also choose whether the connection to your server uses HTTPS, HTTP or falls back automatically, which helps when the new server doesn't have a valid certificate for the domain yet. With a free account you can also put a password on a link, so it isn't open to anyone who gets hold of the URL, and create links that never expire.

### The honest limitations

A preview link is a proxy, so your traffic passes through a third party. If you work under rules that forbid that, or you're testing something involving genuinely sensitive data, the hosts file keeps everything on your own machine, and that's a real advantage.

One more thing, and it applies to both approaches equally. If your domain normally sits behind a CDN like Cloudflare, pointing either a hosts entry or a preview link at your origin server only tests the origin. The edge isn't involved, so page rules, caching behaviour and edge redirects aren't being tested. Plan a separate check for those once you've cut over.

## When the hosts file is still the right tool

It hasn't been made obsolete. It's still the right choice when:

- You need a quick check on one machine, for one hostname, and nobody else needs to see it
- You're working somewhere that won't allow traffic through an outside service
- You need to test something that isn't plain HTTP, like a mail server or a service on an unusual port, where a web proxy can't help

For everything else, and especially anything a client has to sign off on, the real sticking point is who can see it. The hosts file can't leave your laptop, and a migration is rarely something you approve on your own.

## The short version

Editing the hosts file sends the right `Host` header and the right SNI, so it genuinely tests the new server under your real domain. That part's correct and always has been.

What it can't do is travel. One machine, admin rights needed, exact hostnames only, no phones, and Firefox might skip it. If you're the only person who needs to see the new server, it's fine. The moment someone else needs to look, you want a link.
