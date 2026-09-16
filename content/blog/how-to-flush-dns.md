---
title: "How to flush DNS on Windows, Mac and Linux"
seoTitle: "How to Flush DNS on Windows, Mac and Linux"
description: "Flush DNS with ipconfig /flushdns on Windows, one Terminal command on Mac, or resolvectl on Linux. Plus browsers, phones, and when it actually helps."
summary: "Run ipconfig /flushdns on Windows, sudo dscacheutil -flushcache followed by sudo killall -HUP mDNSResponder on a Mac, or sudo resolvectl flush-caches on Linux. It takes effect immediately and no restart is needed. Chrome and Firefox keep their own separate caches, which is why flushing the operating system alone can look like it did nothing."
publishedAt: "2026-09-13"
author: "Romail Shah"
authorBio: "Romail Shah is a full-stack developer and the founder of DNS Previewer, a free tool for checking a website on a new server before you change DNS. He builds and migrates client sites for a living."
category: "DNS"
tags: ["dns", "flush dns", "dns cache", "windows", "macos", "linux", "troubleshooting"]
keywords:
  [
    "how to flush dns",
    "flush dns",
    "dns flush",
    "ipconfig /flushdns",
    "ipconfig flushdns",
    "dns flush command",
    "how to flush dns cache",
    "flush dns mac",
    "windows flush dns",
    "how to flush dns windows 11",
    "linux flush dns",
    "clear dns cache",
  ]
faqs:
  - q: "Is it safe to flush DNS?"
    a: "Yes, completely. Flushing only throws away the name lookups your computer has cached, and the next time you visit a site it just asks a DNS server again. Your files, passwords, bookmarks and browsing history aren't touched. The worst that happens is the first visit to each site afterwards takes a few milliseconds longer while the cache fills back up."
  - q: "Does flushing DNS make the internet faster?"
    a: "No, and it can make the first few lookups a touch slower. The cache is there to speed things up in the first place: Windows uses it to resolve names you visit often without asking a DNS server every time, so clearing it throws that head start away until it rebuilds. It's worth doing when a site is loading from the wrong place or a domain won't resolve, but there's no speed to gain from doing it routinely."
  - q: "Do I need to restart my computer after flushing DNS?"
    a: "No. The cache clears the moment the command runs, on Windows, macOS and Linux. You might need to close and reopen your browser, though, because Chrome and Firefox keep their own DNS cache that flushing the operating system doesn't touch."
  - q: "Does clearing the DNS cache delete browsing history?"
    a: "No. Your browser stores its history separately, and flushing DNS leaves it exactly as it was. The DNS cache only holds which domain names point to which IP addresses. One small caveat: on Windows, ipconfig /displaydns lists domain names you've recently looked up, so flushing does wipe that particular list. Your actual browser history stays put."
  - q: "How do I renew my IP address and flush DNS at the same time?"
    a: "On Windows, open Command Prompt as administrator and run these three in order: ipconfig /release, then ipconfig /renew, then ipconfig /flushdns. Release drops your current IP address, which cuts you off the network until renew asks for a new one, so don't run it if you're connected to that machine remotely. Flushing DNS on its own won't change your IP address. The two fix different problems."
  - q: "How do I see what's in the DNS cache?"
    a: "On Windows, run ipconfig /displaydns in Command Prompt, or Get-DnsClientCache in PowerShell. Microsoft notes the output includes entries preloaded from the local hosts file as well as names you've recently resolved, which makes it handy for checking whether a hosts file edit has been picked up."
  - q: "I flushed DNS and the website still shows the old version. Why?"
    a: "Because your computer's cache is only one of several. Your router, your internet provider's DNS resolver and the TTL on the DNS record itself all keep their own copy of the old answer, and flushing your machine can't reach any of them. If you've just changed a DNS record, the wait is set by the TTL that was on the record before you changed it, not by anything on your computer."
---

Flushing DNS clears the website addresses your computer has remembered, so it looks them up fresh. The command depends on what you're using:

```
Windows (Command Prompt)   ipconfig /flushdns
Windows (PowerShell)       Clear-DnsClientCache
macOS                      sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
Linux (systemd)            sudo resolvectl flush-caches
```

They all work straight away, and you don't need to restart. If that fixed it, you're done. If not, your browser or phone probably has its own cache too, and that's covered further down.

## What flushing DNS actually does

When you visit a website, your computer has to turn a name like `example.com` into an IP address. It doesn't ask a DNS server every single time. It remembers the answers for a while, in what's called the DNS cache.

Most of the time that's exactly what you want. Microsoft describes it as what lets Windows "resolve frequently queried names quickly, before querying its configured DNS servers."

It becomes a problem when one of those remembered answers goes stale. A site moves to a new server and your computer keeps sending you to the old one. Flushing throws the remembered answers out, so the next lookup goes back to a DNS server and gets the current address.

There's a less obvious case too, and it trips people up. The cache doesn't just store lookups that worked, it stores ones that failed. Microsoft's documentation for `ipconfig` says flushing lets you "discard negative cache entries", which is the proper name for a cached "this domain doesn't exist" answer. So if you checked a domain before its DNS was set up, your computer can go on insisting it doesn't exist long after it does. Flushing gets rid of that.

## How to flush DNS on Windows 11 and Windows 10

It's the same command on both.

### Using Command Prompt

1. Press the Windows key and type `cmd`
2. Click **Command Prompt**
3. Type this and press Enter:

```
ipconfig /flushdns
```

Windows prints a short message confirming the DNS resolver cache was flushed. If you get an access denied error instead, close the window, right click Command Prompt, pick **Run as administrator** and try again.

### Using PowerShell

If you'd rather use PowerShell, run:

```
Clear-DnsClientCache
```

Microsoft [documents this cmdlet](https://learn.microsoft.com/en-us/powershell/module/dnsclient/clear-dnsclientcache) as "equivalent to running `ipconfig /flushdns`", so use whichever you already have open.

### Checking what's in the cache first

You can see what Windows has remembered before you clear it:

```
ipconfig /displaydns
```

Or `Get-DnsClientCache` in PowerShell.

There's a useful detail buried in [Microsoft's ipconfig reference](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/ipconfig): the cache includes entries "preloaded from the local Hosts file" as well as normal lookups. So if you've edited your hosts file and want to know whether Windows has noticed, `/displaydns` will tell you. Flushing won't change anything in the hosts file itself, mind. If you need to edit that, the [Windows hosts file guide](/blog/windows-hosts-file-location) covers where it lives and why Windows so often refuses to save it.

## How to flush DNS on Mac

Open **Terminal**. You'll find it in Applications, then Utilities, or press Command and Space and type `terminal`. Then run:

```
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

Enter your Mac login password when it asks, and press Return. You won't see the password as you type, which is normal.

Nothing gets printed when it works, and that catches a lot of people out. macOS doesn't show a confirmation message at all, so if you're simply dropped back at the prompt, it worked.

You do need both parts of that command. The first clears the directory services cache, and the second tells `mDNSResponder`, the process macOS uses for DNS, to reload. Run only one and part of the cache can survive.

The same command works on macOS Ventura, Sonoma, Sequoia and macOS 26 Tahoe.

## How to flush DNS on Linux

Linux is the awkward one, because the answer depends on how your system is set up, and there may be nothing to flush at all.

Plenty of Linux installs don't keep a local DNS cache. You'll only have one to clear if you're running a caching service like `systemd-resolved`, `nscd` or `dnsmasq`.

### Ubuntu, Debian and other systemd distributions

On current releases, including Ubuntu 22.04, Ubuntu 24.04 and Debian Bookworm:

```
sudo resolvectl flush-caches
```

Older guides tell you to run `sudo systemd-resolve --flush-caches`. That command was renamed to `resolvectl` in systemd version 239, and the old name is deprecated. On newer distributions it just throws an error.

### If you use nscd

```
sudo systemctl restart nscd
```

### If you use dnsmasq

```
sudo systemctl restart dnsmasq
```

## How to clear the DNS cache in your browser

Chrome and Firefox each keep a DNS cache of their own, completely separate from your operating system. You can flush Windows or macOS perfectly and still get the old site in your browser, which is usually when people conclude flushing doesn't work.

### Chrome

1. Type `chrome://net-internals/#dns` into the address bar and press Enter
2. Click **Clear host cache**

There's no confirmation, it just clears. If a page still loads from the old server after that, Chrome may be reusing a connection it already had open. Go to `chrome://net-internals/#sockets` and click **Flush socket pools** to close them.

### Firefox

1. Type `about:networking#dns` into the address bar and press Enter
2. Click **Clear DNS Cache**

Mozilla added that button in [bug 1593476](https://bugzilla.mozilla.org/show_bug.cgi?id=1593476). If you've got DNS over HTTPS turned on in Firefox, it resolves names inside the browser instead of going through your operating system, which is one more reason to clear it here.

## How to flush DNS on iPhone and Android

Neither phone gives you a flush DNS button.

On an iPhone, open Settings, switch **Airplane Mode** on, then switch it off again. Restarting the phone does the same job.

Android has no system option for it. Open Chrome, go to `chrome://net-internals/#dns` and tap **Clear host cache**. That clears the browser's cache, which is usually the one causing trouble anyway.

## When flushing DNS helps, and when it won't

Flushing fixes things on your own device. It's the right thing to try when:

- A site you use has moved to a new server and your computer keeps loading the old one
- A domain that didn't exist a few minutes ago does now, but your computer still says it can't be found
- You've edited your hosts file and the change isn't taking effect
- The site works on someone else's device but not yours

It won't help when the stale answer lives somewhere other than your computer. Your router, your internet provider's DNS servers and the TTL on the DNS record all hold copies you can't reach from your keyboard. If you've just changed a DNS record and the new server still isn't showing, that wait is controlled by the TTL that was on the record before you changed it. [How long DNS propagation really takes](/blog/dns-propagation-time-what-actually-happens) goes into which part of that you can actually influence.

It's also why flushing is a poor way to test a site you're moving. You'd be waiting on caches all over the internet, not only yours. It's much quicker to check the new server directly before you touch DNS at all. [DNS Previewer](/) gives you a link that loads your site from the new server under its real domain name, so you can make sure everything works and then change the record. It's free, and the link opens on any device, phones included, without flushing a thing.
