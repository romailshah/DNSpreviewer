---
title: "ERR_SSL_VERSION_OR_CIPHER_MISMATCH: what it means and how to fix it"
seoTitle: "ERR_SSL_VERSION_OR_CIPHER_MISMATCH: Causes and Fixes"
description: "This error means your browser and the server share no TLS version or cipher they both accept. What a visitor can do, and the five server-side causes worth checking."
summary: "Your browser and the server could not agree on a TLS version or a cipher, so the connection stopped before any page loaded. On the visitor's side there is no way through it, and no Advanced link to click. If the site is yours, the usual causes are a server still offering only TLS 1.0 or 1.1, a hand-written cipher list that excludes everything current browsers accept, or a certificate that does not cover the hostname being asked for."
publishedAt: "2026-10-03"
author: "Romail Shah"
authorBio: "Romail Shah is a full-stack developer and the founder of DNS Previewer, a free tool for checking a website on a new server before you change DNS. He builds and migrates client sites for a living."
category: "Troubleshooting"
hireCta: true
tags: ["ssl", "tls", "chrome", "nginx", "cloudflare", "troubleshooting"]
keywords:
  [
    "err_ssl_version_or_cipher_mismatch",
    "err_ssl_version_or_cipher_mismatch chrome",
    "err_ssl_version_or_cipher_mismatch meaning",
    "err_ssl_version_or_cipher_mismatch bypass",
    "uses an unsupported protocol",
    "cipher mismatch",
    "unsupported protocol error",
    "ssl version mismatch",
  ]
faqs:
  - q: "What does ERR_SSL_VERSION_OR_CIPHER_MISMATCH mean?"
    a: "It means your browser and the server found nothing in common to encrypt with. Chrome's error list defines the code as the client and server not supporting a common SSL protocol version or cipher suite, and the page says the site uses an unsupported protocol. Every HTTPS connection starts with the two sides comparing lists: which TLS versions they speak, and which ciphers they accept. If those lists don't overlap, the conversation stops there and no page is ever sent."
  - q: "How do I fix ERR_SSL_VERSION_OR_CIPHER_MISMATCH?"
    a: "As a visitor, check whether other HTTPS sites load. If they do, the server is at fault and there's nothing to fix on your machine. If the site is yours, the fix is almost always on the server: enable TLS 1.2 and 1.3, stop pinning an old cipher list, and make sure the certificate actually covers the hostname. On Cloudflare, check that the record is proxied and the certificate is active, because an unproxied record isn't covered by their certificate."
  - q: "How do I bypass ERR_SSL_VERSION_OR_CIPHER_MISMATCH in Chrome?"
    a: "You can't, and there's no Advanced link to click through like a certificate warning. A certificate warning means the connection worked and the identity is doubtful. Here no connection was ever established, so there's nothing to proceed into. Old advice about enabling TLS 1.0 in browser flags no longer applies, since browsers removed those switches after TLS 1.0 and 1.1 were formally deprecated."
  - q: "Is ERR_SSL_VERSION_OR_CIPHER_MISMATCH my computer or the website?"
    a: "Open two or three other HTTPS sites. If they load, the problem belongs to the site. If every site fails the same way, look at your own machine: an old browser or operating system that no longer matches modern servers, or security software that inspects HTTPS traffic and does it badly. Loading the site on a phone over mobile data settles it in under a minute."
  - q: "What's the difference between this and ERR_SSL_PROTOCOL_ERROR?"
    a: "This one is specific: the two sides have no TLS version or cipher in common, and Chrome says the site uses an unsupported protocol. ERR_SSL_PROTOCOL_ERROR is the broader failure, where the handshake breaks for some other reason and the page says the site sent an invalid response. Both stop before any content is sent, but the mismatch error points you straight at protocol versions and ciphers."
  - q: "Why does it happen on Cloudflare?"
    a: "Usually because the certificate doesn't cover the hostname you're visiting. Cloudflare's documentation is explicit that Universal and Advanced certificates only cover domains and subdomains proxied through Cloudflare, so a DNS-only record won't present one, and Universal certificates cover the apex plus one level of subdomain, so something like dev.docs.example.com isn't included. A new Universal certificate can also take from 15 minutes to 24 hours to activate."
  - q: "Can an old server cause this after a migration?"
    a: "Often, yes. Config files get copied from machine to machine for years, and an old one may still pin TLS 1.0 or an ancient cipher list that modern browsers refuse. The site works for whoever tested it in an old browser, then fails for everyone else. It's worth testing the new server properly before DNS points at it rather than finding out afterwards."
---

Chrome shows this one as "This site can't provide a secure connection", then the site name and the line "uses an unsupported protocol", with `ERR_SSL_VERSION_OR_CIPHER_MISMATCH` underneath.

ERR_SSL_VERSION_OR_CIPHER_MISMATCH means the two ends found nothing in common. Before any page can load, your browser and the server compare two lists: the TLS versions they both speak, and the ciphers they both accept. When those lists don't overlap anywhere, there's no secure channel to build, so the connection stops.

The quickest way to work out whose problem it is: open two or three other HTTPS sites. If they load, the server is at fault, and nothing you change locally will help. If everything fails this way, the problem is your machine.

## What the error actually says

Chrome's internal error list [defines this code](https://source.chromium.org/chromium/chromium/src/+/main:net/base/net_error_list.h) as "The client and server don't support a common SSL protocol version or cipher suite", numbered -113. The wording you see on screen, "uses an unsupported protocol", comes from the same codebase.

That's unusually specific as browser errors go. It isn't a certificate problem, a DNS problem or a server crash. Something in the TLS negotiation itself has no common ground.

## If you're the visitor

There's no way through this one. A certificate warning gives you an Advanced link because the connection succeeded and only the site's identity is in question. Here no connection exists, so there's nothing to continue into.

Three things are still worth a minute.

Check whether it's every site or one site. If other HTTPS pages load normally, stop troubleshooting your computer.

Update your browser and your operating system. This error is the normal outcome when a very old client meets a current server, because the versions and ciphers that client knows have all been retired.

Turn off HTTPS scanning in your antivirus temporarily. Security suites that inspect encrypted traffic insert themselves into the handshake, and an out-of-date one can offer the server a set of options nothing modern accepts. If the page loads with that off, you've found it.

Old guides suggest enabling TLS 1.0 in a browser flag. Those switches are gone, and for good reason, as the next section explains.

## If the site is yours

Five causes of ERR_SSL_VERSION_OR_CIPHER_MISMATCH, in the order I'd check them.

### Cause 1: the server still offers only old TLS

TLS 1.0 and 1.1 are formally dead. [RFC 8996](https://www.rfc-editor.org/rfc/rfc8996.html), published in March 2021, says plainly: "TLS 1.0 MUST NOT be used" and "TLS 1.1 MUST NOT be used". Browsers followed, so a server offering only those two has nothing to agree on with a current browser, and this is the error you get.

Both major web servers already ship with sensible defaults. nginx's [`ssl_protocols`](https://nginx.org/en/docs/http/ngx_http_ssl_module.html) defaults to `TLSv1.2 TLSv1.3`, and Apache's [`SSLProtocol`](https://httpd.apache.org/docs/2.4/mod/mod_ssl.html) defaults to `all -SSLv3`. The problem is almost never the default. It's a config file that has been copied from server to server since 2015 with an explicit list in it.

Find the line and bring it up to date:

```
ssl_protocols TLSv1.2 TLSv1.3;
```

Then reload, don't just restart the site.

### Cause 2: the cipher list is too narrow

Versions are only half the negotiation. The two sides also need a cipher suite in common, and this is where hardening guides from a decade ago do real damage.

nginx defaults [`ssl_ciphers`](https://nginx.org/en/docs/http/ngx_http_ssl_module.html) to `HIGH:!aNULL:!MD5`, which is broad and sane. Apache's `SSLCipherSuite` defaults to `DEFAULT`, which the documentation notes depends on your OpenSSL version. Trouble starts when someone pastes a long hand-written list to score well on a security test, then OpenSSL gets upgraded, half those names stop existing, and the server ends up offering a set no browser wants.

If you inherited a long cipher line and you're seeing this error, try removing it and letting the defaults apply. You can always tighten afterwards, with testing.

### Cause 3: Cloudflare isn't covering the hostname

If Cloudflare sits in front, this error usually means the certificate doesn't cover the name being visited, and their documentation is specific about why.

Cloudflare's Universal and Advanced certificates "only cover the domains and subdomains you have proxied through Cloudflare", so a DNS-only record, the grey cloud, gets no certificate from them at all. Universal certificates also cover "your apex domain and one level of subdomain", which means a name like `dev.docs.example.com` isn't included and needs Total TLS, an Advanced certificate or a custom one. On top of that, a newly added domain's Universal certificate can take [15 minutes to 24 hours](https://developers.cloudflare.com/ssl/troubleshooting/version-cipher-mismatch/) to activate.

There's a second Cloudflare setting worth checking. [Minimum TLS Version](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/minimum-tls/) "only allows HTTPS connections from visitors that support the selected TLS protocol version or newer". Set it high and older clients are rejected at the handshake, which looks exactly like this error to the people affected while working perfectly for you.

### Cause 4: no certificate for that hostname

One IP address can serve many sites, so the browser names the host it wants during the handshake, using SNI. If the server has nothing matching that name, the negotiation fails.

This is the single most common version on a brand new server, where the certificate simply hasn't been issued yet. Check what the server really presents:

```
openssl s_client -connect example.com:443 -servername example.com
```

Read the subject line that comes back. If it names a different host, or you get no certificate at all, that's your answer, and [ERR_SSL_PROTOCOL_ERROR](/blog/err-ssl-protocol-error) covers that situation in more detail, since the two errors overlap heavily on new servers.

### Cause 5: the server is stricter than its visitors

The mirror image of cause 1. A server locked to TLS 1.3 only, or to a FIPS-restricted cipher set, will refuse clients that are otherwise perfectly current, including older Android phones and anything embedded.

You can prove which versions a server accepts by asking for them one at a time:

```
openssl s_client -connect example.com:443 -tls1_2
openssl s_client -connect example.com:443 -tls1_3
```

If 1.2 is refused and 1.3 succeeds, you've found a server that's quietly excluding a slice of real visitors. Qualys SSL Labs' public server test shows the same thing as a table, including which clients fail.

## When it starts right after a move

ERR_SSL_VERSION_OR_CIPHER_MISMATCH has a habit of appearing the day a site changes servers, for two reasons that are easy to miss.

The first is the config file. Server configs get copied forward for years, and an old `ssl_protocols` or cipher line travels with them onto a machine that would otherwise have been fine. Whoever tested in one browser saw it work, and everyone else got the error.

The second is the certificate. A new server has none for your domain until it's issued, and most authorities want the hostname pointing at the machine before they'll issue one. So the site looks broken over HTTPS until DNS moves, and DNS can't safely move until the site looks right.

The way out is to check the new server under its real domain before changing any records. [DNS Previewer](/) does that free, and you can tell it to reach your server over HTTP while the certificate question is still open, so you can confirm the site itself works and deal with TLS separately. The [WordPress migration checklist](/blog/wordpress-migration-checklist-test-before-dns) has the rest of the pre-flight list, and a [502 Bad Gateway](/blog/502-bad-gateway) is what you'll see instead when TLS is fine but the application behind it isn't.

<!-- hosting-card -->

## The order I'd work through it

1. Do other HTTPS sites load? If yes, stop looking at your computer.
2. If nothing loads anywhere: update the browser and operating system, then disable antivirus HTTPS scanning.
3. If the site is yours, run `openssl s_client -connect yourdomain.com:443 -servername yourdomain.com` and read what comes back.
4. No certificate, or the wrong name: that's cause 4, and it's a certificate job.
5. A connection that fails instantly: check `ssl_protocols` and the cipher line for an old pinned list.
6. Cloudflare in front: confirm the record is proxied, the certificate is active, the subdomain depth is covered, and Minimum TLS Version isn't set higher than your visitors can manage.
7. Still stuck: test each TLS version separately with `-tls1_2` and `-tls1_3` to see exactly where the overlap breaks.

Nine times out of ten it's a line of configuration older than the server it's running on.
