---
title: "Windows hosts file: where it is and how to edit it"
seoTitle: "Windows Hosts File: Where It Is and How to Edit It"
description: "The Windows hosts file lives at C:\\Windows\\System32\\drivers\\etc\\hosts. Where to find it, how to edit it, and why Windows keeps blocking the save."
publishedAt: "2026-09-10"
author: "Romail Shah"
authorBio: "Romail Shah is a full-stack developer and the founder of DNS Previewer, a free tool for checking a website on a new server before you change DNS. He builds and migrates client sites for a living."
category: "Windows"
tags: ["hosts file", "windows", "windows 11", "dns", "troubleshooting"]
keywords:
  [
    "windows hosts file",
    "windows hosts file location",
    "where is hosts file",
    "cant edit hosts file",
    "how to edit hosts file",
    "hosts file not working",
    "hosts file windows 11",
    "hosts file mac",
    "reset hosts file windows",
  ]
faqs:
  - q: "Where is the hosts file in Windows 11?"
    a: "C:\\Windows\\System32\\drivers\\etc\\hosts. The path is identical on Windows 11, Windows 10, Windows 8 and Windows 7, and has not moved since Windows XP. The file has no extension, so it shows as just hosts with no file type. If your system drive is not C:, use %SystemRoot%\\System32\\drivers\\etc\\hosts instead, which resolves to the correct drive automatically."
  - q: "Does Windows 11 still use the hosts file?"
    a: "Yes. Windows 11 checks the hosts file before sending any DNS query, exactly as every previous version did. Nothing about it has been deprecated. The two things that make it look broken on modern systems are Controlled Folder Access silently blocking writes to the folder, and browsers using DNS over HTTPS resolving names internally and skipping the operating system resolver entirely."
  - q: "Why can't I save the hosts file?"
    a: "Almost always one of three reasons. The editor is not running as Administrator, so the write is refused because the file sits in a protected system folder. Notepad saved it as hosts.txt because the Save as type box was left on Text Documents, which means the real hosts file was never touched. Or Controlled Folder Access in Windows Security is blocking modification of the drivers\\etc folder, which produces a permission error even when you are running elevated."
  - q: "Why is my hosts file not working?"
    a: "Four common causes. Your DNS cache still holds the old answer, so run ipconfig /flushdns. Firefox has DNS over HTTPS enabled and resolves names inside the browser, bypassing the hosts file completely. The file was saved as hosts.txt rather than hosts. Or the entry is there but does not cover the hostname being requested, because the hosts file matches exact names only and www.example.com needs its own separate line."
  - q: "How do I edit the hosts file as administrator?"
    a: "Press the Windows key, type notepad, right click Notepad in the results and choose Run as administrator. Then use File, Open, paste C:\\Windows\\System32\\drivers\\etc\\hosts into the filename box and press Enter. You must change the file type dropdown to All Files first, otherwise the folder appears empty because the hosts file has no .txt extension."
  - q: "Where is the hosts file on Mac and Linux?"
    a: "/etc/hosts on both. Edit it with sudo nano /etc/hosts or sudo vi /etc/hosts, since it is owned by root. On macOS, flush the cache afterwards with sudo dscacheutil -flushcache followed by sudo killall -HUP mDNSResponder. The file format is identical across all three operating systems: an IP address, whitespace, then the hostname."
  - q: "How do I reset the Windows hosts file to default?"
    a: "Replace the contents with the default file, which contains nothing but comment lines beginning with #. A hosts file with no active entries is the normal state for a clean Windows install. Microsoft publishes the exact default contents and a reset procedure in its support documentation. Resetting is worth trying if you suspect malware added redirect entries, since hijacking this file is a well known technique."
---

The Windows hosts file lives here:

```
C:\Windows\System32\drivers\etc\hosts
```

No file extension. Not `hosts.txt`, not `hosts.ini`, just `hosts`. That single detail is behind a good share of the confusion around this file, because Notepad hides extensionless files by default and Windows Explorer shows the folder as empty until you tell it otherwise.

The path has not changed since Windows XP. Windows 11 uses exactly the same location as Windows 10, 8 and 7.

## Where the Windows hosts file is

If your Windows installation is not on the C: drive, use the environment variable instead of hardcoding the letter:

```
%SystemRoot%\System32\drivers\etc\hosts
```

That resolves to whichever drive Windows is actually installed on. You can paste it directly into the Explorer address bar, the Run dialog (Windows key + R), or a Notepad Open box.

Two things about the folder catch people out. The `etc` folder also contains `lmhosts.sam`, `networks`, `protocol` and `services`, and only `hosts` is the one you want. And if you open the folder in Explorer and see nothing, File Explorer is filtering by type. The file is there.

## Does Windows 11 still use the hosts file?

Yes, and nothing about it is deprecated. Windows 11 checks the hosts file before it sends any DNS query, the same as every version before it.

The reason people ask is that two newer behaviours make it look like the file stopped working. Controlled Folder Access, part of Windows Security, can silently block writes to the `drivers\etc` folder. And browsers using DNS over HTTPS resolve hostnames inside the browser, never asking Windows, which means your hosts entry is correct and simply never consulted. Both are covered further down.

## How to edit the hosts file on Windows

The file is in a protected system folder, so an ordinary editor cannot write to it. You need an elevated one.

**The quickest route:**

1. Press the Windows key and type `notepad`
2. Right click Notepad in the results and choose **Run as administrator**
3. In Notepad, choose **File**, then **Open**
4. Paste `C:\Windows\System32\drivers\etc\hosts` into the File name box and press Enter

Step 4 matters. If you browse to the folder instead of pasting the full path, set the file type dropdown from **Text Documents** to **All Files** first, or the folder will look empty.

**From an elevated terminal**, this is one line:

```
notepad %SystemRoot%\System32\drivers\etc\hosts
```

Open Terminal or Command Prompt as administrator first, or the same permission error applies.

### The format

One mapping per line, IP address first, then whitespace, then the hostname. Lines starting with `#` are comments.

```
# Point a domain at a new server for testing
203.0.113.42    example.com
203.0.113.42    www.example.com
```

Note the second line. The hosts file matches **exact hostnames only**. An entry for `example.com` does nothing for `www.example.com`, and there is no wildcard syntax, so `*.example.com` is not valid and will simply be ignored. Every hostname you care about needs its own line.

After saving, clear the DNS cache so Windows stops serving the old answer:

```
ipconfig /flushdns
```

## Why you cannot save the hosts file

This is the most common failure, and it has four distinct causes that produce similar looking errors.

### Your editor is not elevated

Notepad opened normally will let you type changes and then refuse the save, usually offering a Save As dialog pointing at your Documents folder. That dialog is the tell. Windows is not asking where to save, it is telling you it cannot write where you asked. Close it and reopen Notepad as administrator.

### Notepad saved it as hosts.txt

If the Save As dialog appeared and you clicked through it, check the folder. A `hosts.txt` sitting next to `hosts` means your edit went into a new file that Windows will never read. Delete it, and when saving deliberately, set **Save as type** to **All Files** and put the filename in quotes as `"hosts"` so Notepad does not append an extension.

### Controlled Folder Access is blocking the write

This one is modern, and it produces a permission error even when you are correctly running as administrator, which makes it genuinely confusing.

Controlled Folder Access is an anti-ransomware feature in Windows Security that blocks untrusted applications from modifying protected folders. Notepad is not always on its trusted list. Check under **Windows Security**, **Virus and threat protection**, **Ransomware protection**. Either allow your editor through, or turn the feature off briefly and back on afterwards. Microsoft documents the behaviour in its [Controlled folder access reference](https://learn.microsoft.com/en-us/defender-endpoint/controlled-folders).

One catch worth knowing: with Controlled Folder Access enabled, the usual Defender exclusions cannot be applied, so adding an exclusion for the folder will not help while it is on.

### Defender flagged the change as a hijack

Microsoft Defender treats hosts file edits as suspicious by design, because redirecting domains through this file is a standard malware technique. Modifications can trigger a detection called [SettingsModifier:Win32/HostsFileHijack](https://www.microsoft.com/en-us/wdsi/threats/malware-encyclopedia-description?name=SettingsModifier:Win32/HostsFileHijack), and Defender may quietly revert your entries.

If your carefully typed line vanishes minutes later, this is usually why. Check the Protection history in Windows Security before assuming you made a mistake.

## Your edit saved but nothing changed

The file is correct, the save worked, and the browser still loads the old site. In rough order of likelihood:

**The DNS cache is stale.** Run `ipconfig /flushdns`. Chrome keeps a separate cache of its own, cleared at `chrome://net-internals/#dns`.

**Firefox is bypassing it entirely.** With DNS over HTTPS enabled, Firefox resolves names inside the browser over an encrypted connection to a DNS provider, so the request never reaches the Windows resolver and your hosts entry is never consulted. Mozilla has tracked local address overrides under DoH in [bug 1453207](https://bugzilla.mozilla.org/show_bug.cgi?id=1453207) for years. Chrome checks the system resolver for local entries and generally still honours the file, which is why the same test can pass in one browser and fail in another on one machine.

**The hostname does not match exactly.** You added `example.com` and are testing `www.example.com`, or the other way round. Add both.

**A VPN or proxy is intercepting resolution.** Corporate VPN clients frequently route DNS through their own resolver regardless of local configuration.

To confirm what Windows itself thinks, ask it directly rather than trusting a browser:

```
ping example.com
nslookup example.com
```

`ping` respects the hosts file. `nslookup` deliberately does not, because it queries a DNS server directly. If `ping` shows your new IP and `nslookup` shows the old one, that is correct behaviour and confirms your entry is working.

## What the hosts file cannot do

It is a genuinely useful tool with hard limits, and knowing them saves time.

- **No wildcards.** Exact hostnames only. A site with `blog.`, `shop.` and `app.` subdomains needs a line for each, and you have to know the full list in advance.
- **One machine only.** The entry affects the computer it was saved on. You cannot send it to a client or a colleague, and on a managed work laptop they often cannot apply it at all.
- **Nothing on phones or tablets.** There is no supported way to edit the hosts file on stock iOS or Android, which rules out testing on the devices where layout problems are most obvious.
- **No ports or paths.** It maps a hostname to an IP address and nothing else. You cannot redirect a port or a URL path with it.

I wrote about those limits in more detail in [why the hosts file cannot leave your laptop](/blog/preview-website-new-server-without-hosts-file).

## The macOS and Linux equivalent

Both use `/etc/hosts`, with the same format.

```
sudo nano /etc/hosts
```

On macOS, flush the cache afterwards:

```
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

On Linux with systemd, `sudo resolvectl flush-caches`.

## Resetting the file

A default Windows hosts file contains only comment lines beginning with `#` and no active entries. If yours has entries you did not add, particularly ones pointing security or banking domains at odd addresses, that is worth investigating rather than ignoring. Microsoft publishes the exact default contents and a reset procedure in [its support documentation](https://support.microsoft.com/en-us/topic/how-to-reset-the-hosts-file-back-to-the-default-c2a43f9d-e176-c6f3-e4ef-3500277a6dae).

## When to reach for something else

Most people editing this file are doing one specific thing: checking that a website works on a new server before pointing DNS at it. The hosts file does that correctly, because your browser still sends the real `Host` header and the real TLS SNI, so the server picks the right virtual host and certificate.

It just cannot travel. The moment a client, a colleague or your own phone needs to see the same thing, you are stuck talking someone through editing a protected system file over a call.

That is the problem I built [DNS Previewer](https://dnspreviewer.com) to remove. It gives you a link instead of a file edit, works on any device with no configuration, and covers wildcard subdomains that the hosts file cannot express. It is free, and there is an [honest comparison with the paid alternative](/vs-skipdns) including the parts where theirs is better.

If you are here because a DNS change has not taken effect yet, the hosts file is a workaround rather than the answer. [What actually controls that delay](/blog/dns-propagation-time-what-actually-happens) is the TTL on the record, and it is worth understanding before your next migration.
