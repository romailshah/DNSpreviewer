---
title: "Windows hosts file: where it is and how to edit it"
seoTitle: "Windows Hosts File: Where It Is and How to Edit It"
description: "The Windows hosts file lives at C:\\Windows\\System32\\drivers\\etc\\hosts. Where to find it, how to edit it, and why Windows keeps blocking the save."
summary: 'The Windows hosts file lives at C:\Windows\System32\drivers\etc\hosts, has no file extension, and sits in the same place on Windows 11, 10, 8 and 7. To edit it, run Notepad as administrator and paste that path into the Open box. If the save keeps failing, it is usually Notepad writing hosts.txt instead, or Controlled Folder Access blocking the folder.'
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
    a: "C:\\Windows\\System32\\drivers\\etc\\hosts. It's in exactly the same place on Windows 11, 10, 8 and 7, and it hasn't moved since Windows XP. The file has no extension, so it shows up as just hosts with no file type. If Windows isn't installed on your C: drive, use %SystemRoot%\\System32\\drivers\\etc\\hosts instead, which points to the right drive automatically."
  - q: "Does Windows 11 still use the hosts file?"
    a: "Yes. Windows 11 checks the hosts file before it sends any DNS query, just like every version before it, and nothing about it has been deprecated. It can look broken on modern systems for two reasons: Controlled Folder Access quietly blocking writes to the folder, and browsers using DNS over HTTPS, which resolve names themselves and skip the operating system entirely."
  - q: "Why can't I save the hosts file?"
    a: "It's almost always one of three things. Your editor isn't running as administrator, so Windows refuses the write because the file lives in a protected system folder. Notepad saved it as hosts.txt because Save as type was left on Text Documents, so the real hosts file never changed. Or Controlled Folder Access in Windows Security is blocking changes to the drivers\\etc folder, which gives you a permission error even when you're running as administrator."
  - q: "Why is my hosts file not working?"
    a: "There are four usual causes. Your DNS cache still has the old answer, so run ipconfig /flushdns. Firefox has DNS over HTTPS switched on and resolves names inside the browser, which skips the hosts file completely. The file got saved as hosts.txt instead of hosts. Or the entry's there but doesn't match the hostname you're visiting, because the hosts file only matches exact names and www.example.com needs a line of its own."
  - q: "How do I edit the hosts file as administrator?"
    a: "Press the Windows key, type notepad, right click Notepad in the results and choose Run as administrator. Then go to File, Open, paste C:\\Windows\\System32\\drivers\\etc\\hosts into the filename box and press Enter. If you browse to the folder instead, switch the file type dropdown to All Files first, or the folder will look empty because the hosts file has no .txt extension."
  - q: "Where is the hosts file on Mac and Linux?"
    a: "/etc/hosts on both. Edit it with sudo nano /etc/hosts or sudo vi /etc/hosts, since root owns it. On macOS, flush the cache afterwards with sudo dscacheutil -flushcache followed by sudo killall -HUP mDNSResponder. The format's the same on all three systems: an IP address, some whitespace, then the hostname."
  - q: "How do I reset the Windows hosts file to default?"
    a: "Replace what's in it with the default contents, which are nothing but comment lines starting with #. A hosts file with no active entries is normal for a clean Windows install. Microsoft publishes the exact default contents and a reset procedure in its support documentation. It's worth doing if you think malware has added redirect entries, since hijacking this file is a well known trick."
---

The Windows hosts file lives here:

```
C:\Windows\System32\drivers\etc\hosts
```

There's no file extension. Not `hosts.txt`, not `hosts.ini`, just `hosts`. A lot of the confusion around this file comes down to that, because Notepad hides files without an extension by default and File Explorer shows the folder as empty until you tell it otherwise.

The path hasn't changed since Windows XP. Windows 11 keeps it in exactly the same place as Windows 10, 8 and 7.

## Where the Windows hosts file is

If Windows isn't installed on your C: drive, use the environment variable rather than typing the drive letter:

```
%SystemRoot%\System32\drivers\etc\hosts
```

That points to whichever drive Windows is actually on. You can paste it straight into the File Explorer address bar, the Run dialog (Windows key + R), or Notepad's Open box.

The folder itself catches people out in a couple of ways. The `etc` folder also holds `lmhosts.sam`, `networks`, `protocol` and `services`, and `hosts` is the only one you want. If you open the folder and it looks empty, File Explorer is filtering by file type. The file's there.

## Does Windows 11 still use the hosts file?

Yes, and none of it has been deprecated. Windows 11 checks the hosts file before it sends a DNS query, the same way every version before it has.

People ask because two newer features can make it look like it's stopped working. Controlled Folder Access, part of Windows Security, can quietly block writes to the `drivers\etc` folder. And browsers that use DNS over HTTPS look up hostnames themselves without asking Windows, so your hosts entry can be perfectly correct and just never get read. Both are covered further down.

## How to edit the hosts file on Windows

The file sits in a protected system folder, so a normal editor can't write to it. You need to run one as administrator.

The quickest way:

1. Press the Windows key and type `notepad`
2. Right click Notepad in the results and choose **Run as administrator**
3. In Notepad, choose **File**, then **Open**
4. Paste `C:\Windows\System32\drivers\etc\hosts` into the File name box and press Enter

Pasting the full path in step 4 saves you a headache. If you browse to the folder instead, change the file type dropdown from **Text Documents** to **All Files** first, or the folder will look empty.

If you'd rather use a terminal, it's one line:

```
notepad %SystemRoot%\System32\drivers\etc\hosts
```

Just open Terminal or Command Prompt as administrator first, or you'll hit the same permission error.

### The format

It's one mapping per line: the IP address first, then some whitespace, then the hostname. Lines that start with `#` are comments.

```
# Point a domain at a new server for testing
203.0.113.42    example.com
203.0.113.42    www.example.com
```

Look at the second line there. The hosts file only matches exact hostnames, so an entry for `example.com` does nothing for `www.example.com`. There's no wildcard syntax either, and `*.example.com` isn't valid, so Windows just ignores it. Every hostname you care about needs its own line.

Once you've saved, clear the DNS cache so Windows stops handing out the old answer:

```
ipconfig /flushdns
```

## Why you cannot save the hosts file

This is where most people get stuck, and there are four different causes that all produce much the same looking error.

### Your editor is not elevated

If you open Notepad normally, it'll let you type your changes and then refuse to save, usually by popping up a Save As box pointed at your Documents folder. That box gives it away. Windows can't write where you asked, and offering you somewhere else is its way of saying so. Close it and reopen Notepad as administrator.

### Notepad saved it as hosts.txt

If that Save As box appeared and you clicked through it, go and check the folder. A `hosts.txt` sitting next to `hosts` means your changes went into a brand new file that Windows will never look at. Delete it. Next time you save, set **Save as type** to **All Files** and type the filename in quotes as `"hosts"`, so Notepad doesn't tack an extension on.

### Controlled Folder Access is blocking the write

This one's newer, and it's genuinely confusing, because you get a permission error even when you're correctly running as administrator.

Controlled Folder Access is an anti-ransomware feature in Windows Security that stops untrusted apps changing protected folders, and Notepad isn't always on its trusted list. You'll find it under **Windows Security**, **Virus and threat protection**, **Ransomware protection**. Either let your editor through, or switch the feature off for a moment and turn it back on once you're done. Microsoft explains how it behaves in its [Controlled folder access reference](https://learn.microsoft.com/en-us/defender-endpoint/controlled-folders).

It's also worth knowing that the usual Defender exclusions can't be applied while Controlled Folder Access is on, so adding an exclusion for the folder won't help.

### Defender flagged the change as a hijack

Microsoft Defender treats changes to the hosts file as suspicious on purpose, since redirecting domains through this file is a standard malware trick. Editing it can trigger a detection called [SettingsModifier:Win32/HostsFileHijack](https://www.microsoft.com/en-us/wdsi/threats/malware-encyclopedia-description?name=SettingsModifier:Win32/HostsFileHijack), and Defender may quietly undo your changes.

So if the line you carefully typed disappears a few minutes later, that's usually why. Have a look at Protection history in Windows Security before you assume you did something wrong.

## Your edit saved but nothing changed

The file's right, the save worked, and your browser still loads the old site. Here are the likely culprits, most common first.

The DNS cache is out of date. Run `ipconfig /flushdns`. Chrome keeps its own separate cache too, which you clear at `chrome://net-internals/#dns`. There's a [full guide to flushing DNS](/blog/how-to-flush-dns) covering every browser and operating system.

Firefox is skipping the file altogether. With DNS over HTTPS switched on, Firefox looks names up inside the browser over an encrypted connection to a DNS provider, so the request never reaches Windows and your hosts entry never gets read. Mozilla has been tracking support for local overrides under DoH in [bug 1453207](https://bugzilla.mozilla.org/show_bug.cgi?id=1453207) for years. Chrome checks the system resolver for local entries and usually still honours the file, which is why the same test can work in one browser and fail in another on the same machine.

The hostname doesn't match exactly. You added `example.com` but you're testing `www.example.com`, or the other way round. Add both.

A VPN or proxy is getting in the way. Corporate VPN clients often send DNS through their own resolver no matter what's configured locally.

To see what Windows itself thinks, ask it directly instead of trusting a browser:

```
ping example.com
nslookup example.com
```

`ping` uses the hosts file. `nslookup` deliberately doesn't, because it goes straight to a DNS server. So if `ping` shows your new IP and `nslookup` still shows the old one, everything's working as it should and your entry is being picked up.

## What the hosts file cannot do

It's a genuinely useful tool, but it has hard limits, and knowing them up front saves time.

- No wildcards. It only matches exact hostnames, so a site with `blog.`, `shop.` and `app.` subdomains needs a line for each, and you have to know the full list before you start.
- It only works on one machine. The entry affects the computer it was saved on. You can't send it to a client or a colleague, and on a managed work laptop they often won't be allowed to apply it anyway.
- It won't work on phones or tablets. There's no supported way to edit the hosts file on a stock iPhone or Android device, which rules out testing on the screens where layout problems show up most.
- No ports or paths. It maps a hostname to an IP address and that's all. You can't use it to redirect a port or a URL path.

I've gone into those limits in more detail in [why the hosts file cannot leave your laptop](/blog/preview-website-new-server-without-hosts-file).

## The macOS and Linux equivalent

Both use `/etc/hosts`, in the same format.

```
sudo nano /etc/hosts
```

On macOS, flush the cache afterwards:

```
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

On Linux with systemd, run `sudo resolvectl flush-caches`.

## Resetting the file

A default Windows hosts file has nothing in it but comment lines starting with `#`, and no active entries. If yours has entries you didn't add, especially ones pointing security or banking sites at odd addresses, look into it properly. Microsoft publishes the exact default contents and a reset procedure in [its support documentation](https://support.microsoft.com/en-us/topic/how-to-reset-the-hosts-file-back-to-the-default-c2a43f9d-e176-c6f3-e4ef-3500277a6dae).

## When to reach for something else

Most people editing this file are doing one particular job: checking a website works on a new server before pointing DNS at it. The hosts file does that properly, because your browser still sends the real `Host` header and the real TLS SNI, so the server picks the right virtual host and certificate.

The trouble is it can't travel. As soon as a client, a colleague or your own phone needs to see the same thing, you're stuck talking someone through editing a protected system file over a call.

That's the problem I built [DNS Previewer](https://dnspreviewer.com) to get rid of. You get a link instead of a file edit, it works on any device with no setup, and it handles wildcard subdomains that the hosts file can't. It's free, and there's an [honest comparison with the paid alternative](/vs-skipdns) that includes the parts where theirs is better.

If you ended up here because a DNS change still hasn't taken effect, editing the hosts file will only paper over it on one machine. [What actually controls that delay](/blog/dns-propagation-time-what-actually-happens) is the TTL on the record, and it's worth understanding before your next migration.
