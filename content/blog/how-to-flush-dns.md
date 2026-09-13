---
title: "How to flush DNS on Windows, Mac and Linux"
seoTitle: "How to Flush DNS on Windows, Mac and Linux"
description: "Flush DNS with ipconfig /flushdns on Windows, one Terminal command on Mac, or resolvectl on Linux. Plus browsers, phones, and when it actually helps."
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
    a: "Yes. Flushing DNS only discards the name lookups your computer has cached. The next time you visit a site, your computer simply asks a DNS server for the address again. No files, passwords, bookmarks or browsing history are touched, and nothing breaks. The worst outcome is that the first visit to each site afterwards takes a few milliseconds longer while the cache refills."
  - q: "Does flushing DNS make the internet faster?"
    a: "Not in general, and it can make the first few lookups very slightly slower. The DNS cache exists to speed things up: Windows uses it to resolve frequently visited names quickly without asking a DNS server every time. Clearing it throws that head start away until it rebuilds. What flushing does is fix wrong or out-of-date answers, such as a site that moved to a new server or a domain that recently failed to resolve. It is a repair, not a performance tweak."
  - q: "Do I need to restart my computer after flushing DNS?"
    a: "No. The cache is cleared the moment the command runs, on Windows, macOS and Linux alike. You may need to close and reopen your browser, because Chrome and Firefox keep a separate DNS cache of their own that flushing the operating system does not touch."
  - q: "Does clearing the DNS cache delete browsing history?"
    a: "No. Browsing history is stored by your browser, separately from the DNS cache, and flushing DNS leaves it exactly as it was. The DNS cache only holds the mapping between domain names and IP addresses. It is worth knowing that on Windows the command ipconfig /displaydns lists recently looked-up domain names, so flushing does remove that particular record, but your browser history itself is untouched."
  - q: "How do I renew my IP address and flush DNS at the same time?"
    a: "On Windows, open Command Prompt as administrator and run three commands in order: ipconfig /release, then ipconfig /renew, then ipconfig /flushdns. Release drops your current IP address, which disconnects you from the network until renew requests a new one, so do not run it while connected to the machine remotely. Flushing DNS on its own does not change your IP address; the two fix different problems."
  - q: "How do I see what is in the DNS cache?"
    a: "On Windows, run ipconfig /displaydns in Command Prompt, or Get-DnsClientCache in PowerShell. Microsoft notes that the output includes entries preloaded from the local hosts file as well as recently resolved names, which is useful if you are trying to confirm whether a hosts file entry has been picked up."
  - q: "I flushed DNS and the website still shows the old version. Why?"
    a: "Because your computer's cache is only one of several. Your router, your internet provider's DNS resolver and the TTL set on the DNS record itself all hold their own copy of the old answer, and flushing your own machine cannot reach any of them. If you recently changed a DNS record, the delay is controlled by the TTL that was on the record before the change, not by anything on your computer."
---

Flushing DNS clears the list of website addresses your computer has remembered, so it looks them up fresh. Here is the command for each system:

```
Windows (Command Prompt)   ipconfig /flushdns
Windows (PowerShell)       Clear-DnsClientCache
macOS                      sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
Linux (systemd)            sudo resolvectl flush-caches
```

Each one takes effect immediately, and none of them require a restart. The details for each system, and the separate caches your browser and phone keep, are below.

## What flushing DNS actually does

Every time you visit a website, your computer has to turn a name like `example.com` into an IP address. Rather than asking a DNS server on every single visit, it remembers the answers for a while in a local store called the DNS cache.

That is normally what you want. Microsoft describes the cache as the thing that lets Windows "resolve frequently queried names quickly, before querying its configured DNS servers."

The trouble starts when a remembered answer goes out of date. A website moves to a new server, but your computer keeps sending you to the old address. Flushing DNS throws those remembered answers away, so the next lookup asks a DNS server again and gets the current one.

There is a second, less obvious reason it helps. The cache does not only store successful lookups. It also stores failures. Microsoft's documentation for `ipconfig` says flushing lets you "discard negative cache entries", which is the technical name for a cached "this domain does not exist" answer. If you checked a domain before its DNS was set up, your computer can keep telling you it does not exist even after it does. Flushing clears that.

## How to flush DNS on Windows 11 and Windows 10

The command is the same on both versions.

### Using Command Prompt

1. Press the Windows key and type `cmd`
2. Click **Command Prompt**
3. Type the following and press Enter:

```
ipconfig /flushdns
```

Windows prints a short confirmation that the DNS resolver cache was flushed. If you see an access denied error instead, close the window, right click Command Prompt, choose **Run as administrator**, and try again.

### Using PowerShell

If you prefer PowerShell, the equivalent is:

```
Clear-DnsClientCache
```

Microsoft [documents this cmdlet](https://learn.microsoft.com/en-us/powershell/module/dnsclient/clear-dnsclientcache) as "equivalent to running `ipconfig /flushdns`", so there is no difference in what it does. PowerShell simply gives you the same result through its own command set.

### Checking what is in the cache first

Before you flush, you can see exactly what Windows has remembered:

```
ipconfig /displaydns
```

Or in PowerShell, `Get-DnsClientCache`.

One detail in [Microsoft's ipconfig reference](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/ipconfig) is easy to miss: the cache includes entries "preloaded from the local Hosts file" alongside ordinary lookups. So if you have edited your hosts file and want to confirm Windows has picked up the change, `/displaydns` is the place to check. Flushing the cache does not edit or remove anything in the hosts file itself. If you need to change that file, the [Windows hosts file guide](/blog/windows-hosts-file-location) covers where it lives and why Windows often blocks the save.

## How to flush DNS on Mac

Open **Terminal**, from Applications then Utilities, or by pressing Command and Space and typing `terminal`. Then run:

```
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

Type your Mac login password when asked and press Return. The password does not appear on screen as you type, which is normal.

Two things tend to worry people here. First, **nothing is printed when it succeeds**. macOS gives no confirmation message, so a silent return to the prompt means it worked. Second, **you need both halves of the command**. The first part clears the directory services cache. The second sends a signal to `mDNSResponder`, the macOS process that handles DNS, telling it to reload. Running only one of them can leave part of the cache in place.

This same command works on macOS Ventura, Sonoma, Sequoia and macOS 26 Tahoe.

## How to flush DNS on Linux

Linux is the one system where the answer depends on your setup, and where there may be nothing to flush at all.

A lot of Linux installations do not keep a local DNS cache. There is only something to clear if you are running a caching service such as `systemd-resolved`, `nscd` or `dnsmasq`.

### Ubuntu, Debian and other systemd distributions

On current releases, including Ubuntu 22.04, Ubuntu 24.04 and Debian Bookworm, use:

```
sudo resolvectl flush-caches
```

You may find older guides telling you to run `sudo systemd-resolve --flush-caches`. That command was renamed to `resolvectl` in systemd version 239. The old name is deprecated and produces an error on newer distributions, so use `resolvectl`.

### If you use nscd

```
sudo systemctl restart nscd
```

### If you use dnsmasq

```
sudo systemctl restart dnsmasq
```

## How to clear the DNS cache in your browser

This is the step people miss. **Chrome and Firefox each keep their own DNS cache**, separate from your operating system. You can flush Windows or macOS perfectly and still see the old site in your browser.

### Chrome

1. Type `chrome://net-internals/#dns` into the address bar and press Enter
2. Click **Clear host cache**

There is no confirmation, and the cache is cleared immediately. If a page still loads from an old server, Chrome may be reusing a connection it already has open. Go to `chrome://net-internals/#sockets` and click **Flush socket pools** to close them.

### Firefox

1. Type `about:networking#dns` into the address bar and press Enter
2. Click **Clear DNS Cache**

Mozilla added that button in [bug 1593476](https://bugzilla.mozilla.org/show_bug.cgi?id=1593476). If you have DNS over HTTPS switched on in Firefox, it resolves names inside the browser rather than through your operating system, which is another reason to clear it here directly.

## How to flush DNS on iPhone and Android

Neither phone has a flush DNS button in its settings.

**On iPhone,** open Settings, turn **Airplane Mode** on, then turn it off again. Restarting the iPhone also clears it.

**On Android,** there is no system option. Open Chrome, go to `chrome://net-internals/#dns`, and tap **Clear host cache**. That clears the browser's cache, which is usually the one causing the problem.

## When flushing DNS helps, and when it will not

Flushing fixes a problem on **your own device**. It is the right move when:

- A website you visit has moved to a new server, and your computer keeps loading the old one
- A domain that did not exist a few minutes ago now does, but your computer still reports it as not found
- You edited your hosts file and the change is not taking effect
- One device loads a site correctly while yours does not

It will **not** help when the out-of-date answer is somewhere other than your computer. Your router, your internet provider's DNS servers and the DNS record's own TTL all hold copies you cannot reach from your keyboard. If you have just changed a DNS record and the new server still is not showing up, that delay is controlled by the TTL that was on the record before you changed it. [How long DNS propagation really takes](/blog/dns-propagation-time-what-actually-happens) explains which part of that wait you control.

That is also why flushing is a poor way to test a site you are moving. You would be waiting on caches all over the internet, not just your own. It is far quicker to check the new server directly before touching DNS at all. [DNS Previewer](/) gives you a link that loads your site from the new server under its real domain name, so you can confirm everything works first and change the record once you know it does. It is free, and the link works on any device, phones included, without flushing anything.
