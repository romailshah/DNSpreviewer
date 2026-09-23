---
title: "ERR_SSL_PROTOCOL_ERROR: what it means and how to fix it"
seoTitle: "ERR_SSL_PROTOCOL_ERROR: What It Means and How to Fix It"
description: "ERR_SSL_PROTOCOL_ERROR means the HTTPS handshake failed before any page loaded. What's worth trying as a visitor, and the five causes to check if the site is yours."
summary: "ERR_SSL_PROTOCOL_ERROR means the encrypted connection failed while it was being set up, so no page was ever sent. If one site does it and others are fine, the problem is at that site's end. If it's every site, look at your own clock, your antivirus or your network. When the site is yours, the usual causes are a certificate that doesn't cover the hostname, a server still offering only old TLS versions, or nothing actually serving HTTPS on port 443."
publishedAt: "2026-09-23"
author: "Romail Shah"
authorBio: "Romail Shah is a full-stack developer and the founder of DNS Previewer, a free tool for checking a website on a new server before you change DNS. He builds and migrates client sites for a living."
category: "Troubleshooting"
hireCta: true
tags: ["ssl", "tls", "chrome", "nginx", "cloudflare", "troubleshooting"]
keywords:
  [
    "err_ssl_protocol_error",
    "net::err_ssl_protocol_error",
    "err ssl protocol error",
    "ssl protocol error",
    "err_ssl_protocol_error chrome",
    "how to fix err_ssl_protocol_error",
    "err_ssl_protocol_error meaning",
    "err_ssl_version_or_cipher_mismatch",
    "this site can't provide a secure connection",
  ]
faqs:
  - q: "What does ERR_SSL_PROTOCOL_ERROR mean?"
    a: "It means the encrypted connection broke while it was being set up. Before any page is sent, your browser and the server agree on a TLS version and a cipher, and the server proves who it is with a certificate. That conversation failed, so nothing was ever loaded. Chrome's own error list describes the code simply as 'An SSL protocol error occurred', and the page you see says the site sent an invalid response."
  - q: "How do I fix ERR_SSL_PROTOCOL_ERROR?"
    a: "First find out whether it's one site or all of them. If other sites load fine over HTTPS, the fault is at that site's end and there's nothing you can fix. If every site fails, check your computer's clock, turn off any HTTPS or SSL scanning in your antivirus, and try another network. If the site is yours, the fix is on the server: a certificate that covers the hostname, TLS 1.2 or higher enabled, and something actually listening on port 443."
  - q: "How do I bypass ERR_SSL_PROTOCOL_ERROR in Chrome?"
    a: "You can't, and that's deliberate. A certificate warning gives you an Advanced link to continue at your own risk, because the connection itself worked and only the identity is in doubt. Here the handshake never completed, so there's no connection to continue into. Typing http:// instead of https:// sometimes loads the site unencrypted, which tells you the server is up but its HTTPS is broken. Don't send anything private over it."
  - q: "Is ERR_SSL_PROTOCOL_ERROR my computer or the website?"
    a: "Test it in one minute. Open two or three other HTTPS sites. If they work, the problem belongs to the site you can't reach. If they all fail, it's your side, and the three usual culprits are a wrong system clock, antivirus software intercepting HTTPS, and a corporate network or VPN doing the same. Loading the site on your phone over mobile data settles it either way."
  - q: "What's the difference between ERR_SSL_PROTOCOL_ERROR and ERR_SSL_VERSION_OR_CIPHER_MISMATCH?"
    a: "They're neighbours. Chrome's error list defines the mismatch one as the client and server not supporting a common protocol version or cipher suite, and the page says the site uses an unsupported protocol. That's the specific case: usually a server still offering only TLS 1.0 or 1.1, which browsers no longer accept. ERR_SSL_PROTOCOL_ERROR is the broader one, covering handshakes that fail for other reasons too."
  - q: "Why does the error appear on my new server but not the old one?"
    a: "Because the certificate usually belongs to the old server. When files move to a new host, the certificate doesn't come with them, and a fresh one can only be issued once the hostname resolves or you've completed a DNS-based check. Until then the new server either has no certificate for your domain or falls back to a default one for its own hostname, and the handshake fails."
  - q: "Can a wrong clock really cause an SSL error?"
    a: "Yes, and Chrome says as much on its own error page: to establish a secure connection your clock needs to be set correctly, because certificates are only valid between two dates. A machine that thinks it's 2019 will reject perfectly good certificates as not yet valid. It's worth checking first on a computer that's been off for a while, or after a motherboard battery dies."
---

You typed an address, the page never appeared, and Chrome replaced it with "This site can't provide a secure connection" and the line `ERR_SSL_PROTOCOL_ERROR`.

Nothing loaded because nothing was ever sent. HTTPS starts with a handshake: your browser and the server agree which version of TLS they'll speak, pick a cipher, and the server proves its identity with a certificate. Only after all that does a single byte of the page move. This error means the handshake fell over.

There's a quick way to tell whose problem it is. Open two or three other HTTPS sites. If they load, the fault is with the site you're trying to reach, and no setting on your computer will fix it. If they all fail the same way, it's your side, and the section below will sort it.

## What the error actually says

Chrome keeps a list of network error codes, and this one is [defined as](https://source.chromium.org/chromium/chromium/src/+/main:net/base/net_error_list.h) "An SSL protocol error occurred", numbered -107. On screen it comes out as the site name followed by "sent an invalid response."

There's a close relative worth knowing, because the fix is different. `ERR_SSL_VERSION_OR_CIPHER_MISMATCH` is defined as "The client and server don't support a common SSL protocol version or cipher suite", and its page says the site "uses an unsupported protocol." That one is nearly always an old server offering only old TLS. If that's what you're seeing, skip to cause 2.

Other browsers describe the same failure in their own words. Safari says it can't establish a secure connection, Firefox talks about a secure connection failing. It's the same handshake, failing the same way.

## If you're the visitor

Four things are worth doing, roughly in this order.

Check your clock. Certificates are only valid between two dates, so a machine with the wrong date rejects good certificates. Chrome says this itself on its error pages: to establish a secure connection, your clock needs to be set correctly. Turn on automatic time in your system settings, especially on a computer that's been switched off for months.

Turn off HTTPS scanning in your antivirus for a moment. Security suites often inspect encrypted traffic by sitting in the middle of it, and when that goes wrong it breaks handshakes exactly like this. Look for a setting called HTTPS scanning, SSL scanning or encrypted connection scanning. If the site loads with it off, you've found your culprit and the vendor's support is the next stop.

Try a different network. Work wifi, a VPN or a captive portal in a hotel can all intercept traffic. Loading the site on your phone over mobile data takes thirty seconds and tells you whether the network is at fault.

Try another browser. If Chrome fails and Firefox works, the problem is local to Chrome's setup, and a new profile or a reset usually clears it.

One thing you cannot do is click through. A certificate warning offers an Advanced link because the connection worked and only the identity is questionable. Here there's no connection to continue into. Some sites will still load if you type `http://` in front, which proves the server is alive and its HTTPS is broken, but don't log in or type anything private into a page loaded that way.

## If the site is yours

Everything below happens on the server, and in my experience it's nearly always one of five things.

### Cause 1: no certificate for that hostname yet

This is the one that catches migrations. Certificates don't travel with your files. Copy a site to a new server and that machine has no certificate for your domain, so it either serves nothing on 443 or falls back to a default certificate for its own hostname.

The same thing happens on a server hosting several sites. Because one IP address can hold many sites, the browser has to say which hostname it wants during the handshake, using SNI. If the server has no certificate matching that name, the handshake fails. nginx's documentation is blunt about the limits here: for maximum interoperability with clients that don't use SNI, virtual servers with different certificates should listen on different IP addresses.

Check what the server actually presents:

```
openssl s_client -connect example.com:443 -servername example.com
```

The `-servername` option [sets the SNI value](https://docs.openssl.org/master/man1/openssl-s_client/) in the request, which is how you test one specific site on a shared IP. Look at the subject and issuer that come back. If they name a different host, or you get no certificate at all, that's your answer.

### Cause 2: the server only speaks old TLS

TLS 1.0 and 1.1 are no longer acceptable. [RFC 8996](https://www.rfc-editor.org/rfc/rfc8996.html), published in March 2021, is unambiguous: "TLS 1.0 MUST NOT be used" and "TLS 1.1 MUST NOT be used". Browsers followed, so a server still offering only those versions now fails the handshake, usually with the mismatch error rather than this one.

Both major web servers already default to something sane. nginx's [`ssl_protocols`](https://nginx.org/en/docs/http/ngx_http_ssl_module.html) defaults to `TLSv1.2 TLSv1.3`, and Apache's [`SSLProtocol`](https://httpd.apache.org/docs/2.4/mod/mod_ssl.html) defaults to `all -SSLv3`. The trouble comes from old config files copied forward from a server built years ago, where someone pinned an explicit list. Find the line and make it current:

```
ssl_protocols TLSv1.2 TLSv1.3;
```

You can prove which versions a server accepts by asking for one:

```
openssl s_client -connect example.com:443 -tls1_2
```

If that succeeds and the browser still fails, the version isn't your problem.

### Cause 3: nothing is serving HTTPS on port 443

Obvious once you see it, invisible until you check. The web server may only be listening on port 80, or a firewall may be blocking 443, or the service crashed and only the HTTP one came back.

```
curl -vI https://example.com
```

A connection refused means nothing is listening. A timeout usually means a firewall is swallowing the packets. Getting as far as a TLS error means the port is open and the problem is in the handshake itself, which sends you back to causes 1 and 2.

There's a stranger version of this: plain HTTP being served on port 443. The browser starts a TLS handshake, receives what looks like an HTTP response instead, and gives up. That happens when a `listen 443` block is missing the `ssl` flag.

### Cause 4: Cloudflare set to the wrong SSL mode

If Cloudflare sits in front of your site, its encryption mode has to match what your origin server can actually do. Cloudflare's [documentation](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/) describes Full mode as Cloudflare matching the visitor's protocol when it connects to the origin, using HTTPS without validating the origin's certificate, while Full (strict) adds validation of that certificate.

So a mode set to Full or Full (strict) against an origin with no working HTTPS produces errors, and Flexible exists for origins that can't do TLS at all. After a migration, the mode that suited the old server often doesn't suit the new one. Check the origin directly, bypassing Cloudflare, before changing the mode:

```
curl -vI https://203.0.113.42 --resolve example.com:443:203.0.113.42
```

### Cause 5: a broken or incomplete certificate chain

Your certificate is usually signed by an intermediate, which is signed by a root the browser trusts. Leave the intermediate out and some clients can't connect the two.

nginx expects them in one file, in a specific order, and says so plainly: if intermediate certificates should be specified in addition to a primary certificate, they should be specified in the same file, with the primary certificate first. Get the order wrong, or paste only the leaf, and you'll see failures that come and go depending on what each client already has cached.

```
openssl s_client -connect example.com:443 -servername example.com -showcerts
```

That prints the full list the server sends, which is exactly what you need to compare against what your certificate authority gave you.

## When it started right after a move

Then it's almost certainly cause 1, and the timing is the giveaway.

The certificate on the old server covers your domain. The new server has nothing, and it usually can't get anything, because most certificate authorities want to see the hostname pointing at the machine before they'll issue one. So you're stuck between two steps: DNS can't move until the site works, and the certificate can't be issued until DNS moves.

There are two honest ways out. Use a DNS-based validation challenge, which proves you own the domain without pointing traffic anywhere, so the certificate can be issued before the move. Or check the site over a preview link while the certificate question is still open.

[DNS Previewer](/) is the second one. It loads your site from the new server under its real domain name, and you can tell it to connect to your server over HTTP, HTTPS, or to fall back automatically, which is what you want while the new machine has no valid certificate yet. So you can confirm the site itself works, sort the certificate out, then change DNS. The [WordPress migration checklist](/blog/wordpress-migration-checklist-test-before-dns) has the rest of the pre-flight list, and checking the certificate covers the real domain is item one on it for this exact reason.

<!-- hosting-card -->

Two related errors turn up in the same week as this one. A [502 Bad Gateway](/blog/502-bad-gateway) means the handshake worked and the thing behind your web server didn't answer. An [error establishing a database connection](/blog/error-establishing-a-database-connection) means the site is serving fine and the database details are stale. Different layers, different fixes.

## The order I'd work through it

1. Does any other HTTPS site load? If yes, stop looking at your computer.
2. If nothing loads: clock, antivirus HTTPS scanning, then a different network.
3. If the site is yours, run `openssl s_client -connect yourdomain.com:443 -servername yourdomain.com` and read the certificate it returns.
4. Wrong name on the certificate, or no certificate: issue one that covers the hostname.
5. Nothing listening at all: check the web server is up, `listen 443 ssl` is present, and the firewall allows it.
6. Mismatch error rather than this one: raise the TLS versions to 1.2 and 1.3.
7. Cloudflare in front: compare its SSL mode against what the origin can really do.

Most of the time it's a certificate that doesn't cover the name being asked for, and it takes longer to read the error than to fix it.
