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
    a: "On Windows the file is at C:\\Windows\\System32\\drivers\\etc\\hosts and you need to open your editor as Administrator. On macOS and Linux it is /etc/hosts and you need sudo. Add a line with the new server's IP address, a space or tab, then the hostname, for example: 203.0.113.42 example.com. Add a second line for www.example.com if you use it, because the hosts file does not match subdomains automatically. Save, then flush your DNS cache before testing."
  - q: "Can the hosts file use wildcards for subdomains?"
    a: "No. The hosts file matches exact hostnames only. There is no way to write *.example.com and have it cover blog.example.com, shop.example.com and the rest. Every hostname needs its own line, and you have to know all of them in advance. This is the single biggest limitation when you are migrating a WordPress multisite or any site with a lot of subdomains."
  - q: "Why is my hosts file not working?"
    a: "Three common causes. First, DNS caching: your operating system or browser is still holding the old answer, so flush it with ipconfig /flushdns on Windows, or sudo dscacheutil -flushcache followed by sudo killall -HUP mDNSResponder on macOS. Second, Firefox with DNS over HTTPS enabled resolves names inside the browser and skips the operating system resolver, and therefore skips the hosts file entirely. Chrome behaves differently and usually still honours the file, because it checks the system resolver for local entries. Third, the file was saved without administrator rights, so your edit never reached disk."
  - q: "Can I share a hosts file change with a client?"
    a: "Not directly. A hosts file entry only affects the machine it was saved on. To let a client see the new server you would have to talk them through editing a protected system file with administrator rights on their own computer, which is a difficult ask and often blocked outright on managed work laptops. This is the usual reason people look for an alternative."
  - q: "Can I edit the hosts file on an iPhone or Android phone?"
    a: "Not without jailbreaking or rooting the device, which you should not do on a work phone. There is no supported way to add a hosts entry on stock iOS or Android. That rules out checking a migration on the devices where layout and touch problems most often show up."
  - q: "What is the difference between a hosts file entry and a DNS preview link?"
    a: "Both make a browser talk to the new server while still presenting your real domain name to it, so the server picks the right virtual host and the right certificate. The difference is reach. A hosts file entry works on one machine that you had administrator access to. A DNS preview link is a URL, so it works for your client, your colleague, your phone, and anyone else you send it to, with no configuration on their end."
---

Every migration ends at the same place. The files are on the new server, the database is imported, and now you have to decide whether it actually works before you point DNS at it and find out in public.

The usual answer is to edit your hosts file. It is a good answer. It is also older than DNS itself, and it comes with limits that are easy to forget until the moment they bite.

## What editing the hosts file actually does

Before your computer asks a DNS server where `example.com` lives, it checks a plain text file on disk. If that file has a line for the hostname, resolution stops right there and no query goes out to the network.

You will find it here:

- **Windows:** `C:\Windows\System32\drivers\etc\hosts`
- **macOS and Linux:** `/etc/hosts`

Both are protected system files. On Windows you need to run your editor as Administrator, and on macOS or Linux you need `sudo`.

The format is one mapping per line, IP address first:

```
203.0.113.42    example.com
203.0.113.42    www.example.com
```

Here is the part that matters, and the reason this technique is worth knowing at all. Your browser still sends `Host: example.com` in the request, and the TLS handshake still carries `example.com` as the SNI value. The new server sees the real domain name. It picks the correct virtual host and presents the correct certificate, exactly as it would after a real DNS change.

That is why editing the hosts file beats typing the server's IP address into the address bar. When you visit `http://203.0.113.42` directly, the browser sends `Host: 203.0.113.42`, and the server has no idea which site you wanted. You get the default virtual host, which is usually an Apache welcome page, a 404, or somebody else's website on the same box. People see that and think the migration failed. Nothing failed. They just asked the wrong question.

So the hosts file is technically correct. Its problems are practical.

## Where the hosts file runs out of road

### It only works on the machine you edited

This is the big one. A hosts entry is local. Your client cannot see what you see, your colleague cannot see it either, and you cannot email it to anyone.

To bring one other person along you would have to walk them through opening a protected system file with administrator rights on their own computer. On a managed work laptop, that is often blocked at the policy level, so no amount of patience on the call will get you there.

### There are no wildcards

The hosts file matches exact hostnames. There is no syntax for `*.example.com`. If you are migrating a WordPress multisite, or anything with `blog.`, `shop.`, `app.` and a handful of others, you need a line for every single one, and you need to know the full list before you start.

Miss one and you get a confusing half-broken result, where some parts of the site come from the new server and some quietly come from the old one.

### Phones and tablets are out

There is no supported way to edit the hosts file on stock iOS or Android. Short of rooting or jailbreaking a device, mobile testing is simply unavailable through this method.

That hurts more than it sounds, because mobile is where layout breaks, where touch targets overlap, and where a slow new server is most obvious.

### Firefox may ignore it completely

Firefox enables DNS over HTTPS, which resolves names inside the browser over an encrypted connection to a DNS provider. When that is on, resolution never reaches your operating system's resolver, so your hosts file is skipped entirely. Your entry is correct, saved, and completely ignored.

Mozilla has tracked support for local address overrides under DoH in [bug 1453207](https://bugzilla.mozilla.org/show_bug.cgi?id=1453207) for years. Chrome behaves differently here and generally still honours the file, because it checks the system resolver for local entries, which is why the same test can pass in one browser and fail in another on the same machine.

If you are going to rely on the hosts file, check whether DoH is on before you conclude anything about the server.

### Caches will lie to you for a while

Editing the file does not clear what your system already remembers:

- **Windows:** `ipconfig /flushdns`
- **macOS:** `sudo dscacheutil -flushcache` then `sudo killall -HUP mDNSResponder`
- **Chrome, separately:** visit `chrome://net-internals/#dns` and clear the host cache

Skip this and you will spend twenty minutes debugging a server that was fine all along.

### You have to remember to take it out

Stale hosts entries are a genuinely nasty failure mode. You finish the migration, DNS changes properly, everyone moves on, and your machine keeps pointing at the old IP because you never removed the line.

Weeks later the site looks frozen or broken, but only for you. Nobody else can reproduce it. That one has eaten entire afternoons.

## How to preview a site on a new server without touching the hosts file

The alternative is to move the trick off your machine and onto a URL.

A preview link works as a reverse proxy. You give it your domain and the new server's IP address, and it hands you back a link on a subdomain, something like `x7k3p.dnspreviewer.com`. When you open that link, the proxy connects to your new server and sends `Host: example.com` upstream, with the matching SNI on the TLS connection.

The new server sees the same request it would see after a real DNS change. You get the right virtual host and the right certificate behaviour, which is the whole point of the hosts file trick, except now it is a link.

That difference solves most of the list above at once. A link can go to a client. It works on a phone with no configuration. It does not need administrator rights, it is not affected by whether the viewer uses Firefox with DoH, and there is nothing left behind on anyone's machine to forget about.

Wildcards stop being a problem too, because the proxy can be told to cover a whole domain including its subdomains, instead of you enumerating them by hand.

[DNS Previewer](/) does this for free, including the wildcard case. You can also pick whether the upstream connection uses HTTPS, HTTP, or falls back automatically, which matters when the new server does not have a valid certificate for the domain yet. Creating a free account additionally lets you put a password on a link, so it is not openly reachable by anyone who has the URL, and create links that never expire.

### The honest limitations

A preview link is a proxy, so your traffic passes through a third party. If you work under rules that forbid that, or you are testing something involving genuinely sensitive data, the hosts file keeps everything on your own machine and that is a real advantage.

There is a second thing worth knowing, and it applies to both methods equally. If your domain normally sits behind a CDN such as Cloudflare, pointing either a hosts entry or a preview link at your origin server tests the origin, not the edge. Page rules, caching behaviour and edge redirects are not in the path. Plan a separate check for those after the cutover.

## When the hosts file is still the right tool

It has not been made obsolete. Reach for it when:

- You need a quick check on one machine, on one hostname, and nobody else needs to see it
- You are working somewhere that will not allow traffic through an outside service
- You need to test something that is not plain HTTP, such as a mail server or a service on an unusual port, where a web proxy has nothing to offer

For everything else, particularly anything a client needs to sign off on, the limitation that matters is not technical. The hosts file cannot leave your laptop, and a migration is rarely something you approve on your own.

## The short version

Editing the hosts file sends the right `Host` header and the right SNI, so it genuinely tests the new server under your real domain. That part is correct and always has been.

What it cannot do is travel. One machine, admin rights required, exact hostnames only, no phones, and Firefox may skip it. If the only person who needs to see the new server is you, it is fine. The moment somebody else needs to look, you want a link.
