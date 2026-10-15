---
title: "ERR_CONNECTION_REFUSED: what it means and how to fix it"
seoTitle: "ERR_CONNECTION_REFUSED: Causes and How to Fix It"
description: "ERR_CONNECTION_REFUSED means nothing was listening on that port. Why it is not a timeout, and the five server-side causes to check."
summary: "ERR_CONNECTION_REFUSED means the server was reachable and actively turned the connection down, which is different from a timeout. Nothing was listening on the port your browser asked for. On the visitor's side there is almost nothing to fix. If the site is yours, the usual causes are a web server that is not running, one listening on 127.0.0.1 instead of every interface, the wrong port, a firewall rule set to reject rather than drop, or HTTPS that was never configured so port 443 refuses while port 80 answers."
publishedAt: "2026-10-06"
author: "Romail Shah"
authorBio: "Romail Shah is a full-stack developer and the founder of DNS Previewer, a free tool for checking a website on a new server before you change DNS. He builds and migrates client sites for a living."
category: "Troubleshooting"
hireCta: true
tags: ["chrome", "nginx", "docker", "firewall", "hosting", "troubleshooting"]
keywords:
  [
    "err_connection_refused",
    "err_connection_refused meaning",
    "err_connection_refused chrome",
    "err_connection_refused localhost",
    "err_connection_refused wordpress",
    "connection refused",
    "refused to connect",
    "no connection could be made because the target machine actively refused it",
  ]
faqs:
  - q: "What does ERR_CONNECTION_REFUSED mean?"
    a: "It means your browser reached the server and the server turned the connection down. Chrome's internal error list defines the code, numbered -102, as a connection attempt that was refused, and the page says the host refused to connect. In practice there is nothing listening on the port your browser asked for, so the machine answered the knock by closing the door rather than by staying silent."
  - q: "What is the difference between connection refused and connection timed out?"
    a: "A refusal is an answer. The server received the connection attempt and sent back a TCP reset, which the browser reports instantly as ERR_CONNECTION_REFUSED. A timeout is silence. Nothing came back at all, so the browser waits and eventually gives up with ERR_CONNECTION_TIMED_OUT. That difference tells you where to look: a refusal means the machine is up and the service is not, while a timeout usually means a firewall is dropping packets or the address is wrong."
  - q: "How do I fix ERR_CONNECTION_REFUSED?"
    a: "As a visitor, check whether other sites load. If they do, the site is down and nothing on your computer will change that. If the site is yours, check in this order: whether the web server process is running, which address and port it is bound to, whether a firewall rule is set to reject, and whether HTTPS was ever configured. The command ss -tlnp on the server answers the first two in one line."
  - q: "Why does localhost say ERR_CONNECTION_REFUSED?"
    a: "Almost always because the development server is not running, or it is running on a different port than the one in your address bar. The second most common cause is a process bound only to 127.0.0.1 inside a container, which the host cannot reach. Docker publishes to every host address by default, so a port published to 127.0.0.1 on purpose is reachable only from the Docker host itself."
  - q: "Is ERR_CONNECTION_REFUSED my computer or the website?"
    a: "Usually the website. Open two or three other sites, and if they load, the problem is at the far end. If everything is refused, look at your own setup: a VPN or proxy that is configured but not running, a corporate filter, or security software intercepting connections. Loading the page on a phone over mobile data settles it in under a minute."
  - q: "What does 'no connection could be made because the target machine actively refused it' mean?"
    a: "That is the same error seen from Windows rather than from Chrome. Microsoft's socket error table lists it as WSAECONNREFUSED, error 10061, and describes it as the result of trying to connect to a service that is inactive on the other host, meaning one with no server application running. Chrome calls it ERR_CONNECTION_REFUSED. The cause and the fix are identical."
  - q: "Can a firewall cause ERR_CONNECTION_REFUSED?"
    a: "Only a firewall set to reject. A rule that drops packets produces a timeout instead, because nothing is sent back, and the default incoming policy on ufw is deny rather than reject. An iptables REJECT rule does answer, with an ICMP port unreachable message by default, and that reaches the client as a refusal. So the firewall is a real but less common cause than people assume."
  - q: "Why does WordPress show ERR_CONNECTION_REFUSED after moving hosts?"
    a: "Because DNS now points at a machine that is not serving your site yet. The server is up enough to answer, but nginx or Apache has no virtual host for your domain, or no certificate, so port 443 refuses while port 80 may still answer. It is the most predictable version of this error, and also the easiest to avoid by loading the new server under your real domain before changing any records."
---

Chrome shows this one as "This site can't be reached", then the site name in bold followed by "refused to connect", with `ERR_CONNECTION_REFUSED` printed underneath.

That wording is unusually literal, and it is worth taking seriously. Something at the other end received your browser's connection attempt and said no. The machine is there. The service you wanted is not.

Quick way to tell whose problem it is: open two or three other sites. If they load, the fault is at the far end and nothing you change locally will help.

## What the error actually says

Chrome's internal error list [defines the code](https://chromium.googlesource.com/chromium/src/+/main/net/base/net_error_list.h) as "A connection attempt was refused", numbered -102. On the error page itself, the line under the heading comes from a template that reads "`<host>` refused to connect."

If you hit the same thing outside a browser on Windows, you get the other famous wording. Microsoft's socket error table lists `WSAECONNREFUSED`, error 10061, as "Connection refused", and explains it as what you get from "trying to connect to a service that is inactive on the foreign host, that is, one with no server application running". People search for that exact sentence about a target machine actively refusing a connection, and it is this same error seen from a different vantage point.

On Linux and macOS it is `ECONNREFUSED`, which the `connect` manual page defines just as plainly: a connect on a stream socket "found no one listening on the remote address."

Three operating systems, three names, one meaning. Nothing is listening where you knocked.

## Refused and timed out are not the same thing

This is the most useful distinction in the whole error, and most advice skips straight past it.

When a connection attempt arrives for a port with nothing listening, TCP does not stay quiet. [RFC 9293](https://www.rfc-editor.org/rfc/rfc9293.html), the current Transmission Control Protocol specification, puts the rule in one line: "If the connection does not exist (CLOSED), then a reset is sent in response to any incoming segment except another reset." Your browser gets that reset back in milliseconds and reports a refusal.

A timeout is the opposite situation. Nothing comes back at all, so the browser sits there waiting and eventually gives up. Chrome has a separate code for that, `ERR_CONNECTION_TIMED_OUT`, numbered -118, and the `connect` manual page describes the matching `ETIMEDOUT` as a timeout while attempting the connection.

So how fast the page fails is a diagnostic in itself:

| What you see | What it means | Where to look |
|---|---|---|
| Refused, instantly | The machine answered and nothing was listening | The service, the port, the bind address |
| Timed out, after a wait | Nothing answered at all | A firewall dropping packets, wrong IP, host down |

Hold on to that, because it saves real time in the firewall section below.

## If you're the visitor

There is not much here, and most of the advice floating around cannot work, because the decision was made on a machine you do not control.

Check whether it is one site or every site. If other pages load, stop troubleshooting your computer. The site is down, and waiting is the fix.

Check for a proxy or VPN that is set but not running. This is the one genuine client-side cause worth knowing, and it produces exactly this error. If your system is configured to send traffic through a local proxy on some port and that proxy has stopped, every connection gets refused the instant it is made. Turn the proxy setting off, or start the proxy, and the web comes back. On Windows that setting lives under Settings, then Network and internet, then Proxy.

Try the page on mobile data. Thirty seconds, and it tells you whether your network is involved at all.

Clearing your cache will not help, and neither will flushing DNS. The name resolved perfectly well. The refusal happened one step later, when your browser tried to open a connection to the address that came back. Had DNS failed, you would be looking at a different error entirely.

## If the site is yours

Five causes, in the order I check them.

### Cause 1: nothing is actually running

Start here every time, because it is the answer more often than the other four put together.

```
sudo systemctl status nginx
sudo systemctl status php8.3-fpm
```

A web server that crashed, failed to start after a config change, or never came back after a reboot refuses every request. Check the status rather than just restarting, because the status output usually explains why it stopped.

If nginx is refusing to start, it will tell you why:

```
sudo nginx -t
```

One typo in a config file stops the whole server, and the site is then refused rather than broken. That is a meaningful difference from a [502 Bad Gateway](/blog/502-bad-gateway), where nginx is running fine and the thing behind it is the problem.

### Cause 2: it is listening, but not where you can reach it

The second most common cause, and the one that wastes the most hours, because the process is clearly running.

A server bound to `127.0.0.1` accepts connections from the machine itself and refuses everything from outside. It passes every local test and is unreachable from the internet. Check what is actually bound:

```
ss -tlnp
```

Read the Local Address column. `0.0.0.0:443` or `*:443` means every interface, which is what a public site needs. `127.0.0.1:443` means localhost only.

Containers make this easy to get wrong in a second way. Docker's documentation is clear that "when a container's ports are mapped without any specific host address, the Docker daemon publishes ports to all host addresses", and that if you include the localhost address with the publish flag, "only the Docker host can access the published container port". So `-p 127.0.0.1:8080:80` is a deliberate choice that is correct behind a reverse proxy and wrong if you expected the world to reach it.

The same trap exists in Node, Python and Ruby apps. A framework that defaults to localhost in development will refuse outside connections in production until you tell it to bind to `0.0.0.0`.

### Cause 3: the right server, the wrong port

Obvious once stated, and easy to miss at the end of a long migration.

nginx's [`listen` directive](https://nginx.org/en/docs/http/ngx_http_core_module.html) accepts an address, a port, or both, and the documentation notes that if the directive is absent, "either `*:80` is used if nginx runs with the superuser privileges, or `*:8000` otherwise". That second value catches people out on a server where nginx is not running as root. The config looks reasonable, nginx is up, and port 80 is refused because nothing ever bound to it.

Confirm from the outside rather than guessing:

```
curl -v http://example.com
curl -v https://example.com
```

`curl` prints the exact failure, including which port it tried. If one scheme connects and the other is refused, skip ahead to cause 5.

### Cause 4: a firewall rule, but only if it rejects

Here is where the timeout distinction pays off, because "it must be the firewall" is the most common wrong answer to this error.

A firewall that silently discards packets produces a timeout, not a refusal. The ufw manual page makes the choice explicit: "Sometimes it is desirable to let the sender know when traffic is being denied, rather than simply ignoring it. In these cases, use reject instead of deny." The same page notes that on installation ufw has "a default incoming policy of deny", which is the silent one. So a port closed by a default ufw setup times out rather than refusing.

The iptables REJECT target does answer back. Its documentation lists the messages it can send, states that `icmp-port-unreachable` is the default, and describes the `tcp-reset` option as one that "causes a TCP RST packet to be sent back". Either of those reaches the browser as a refusal.

Net result: if your failure is instant, a drop rule is not the cause, and the service deserves your attention first. To check the rules anyway:

```
sudo ufw status verbose
sudo iptables -L -n
```

Cloud firewalls are a separate layer. A security group or network firewall at AWS, Hetzner, DigitalOcean or Vultr can block a port before the server ever sees the packet, and those are normally configured to drop, so again you would expect a timeout. Worth checking, but after the service.

### Cause 5: HTTPS was never set up

This is the version I see most on new servers, and the one that looks most mysterious.

Port 80 answers. Port 443 refuses. The site loads over `http://` and is refused over `https://`. Nothing is wrong with the machine at all. There is simply no server block listening on 443, because the certificate has not been issued yet and nobody configured TLS.

It matters more than it used to, because browsers now reach for HTTPS first. A visitor typing your domain gets sent to port 443, which refuses, and they conclude the site is dead. Meanwhile the site is sitting there perfectly well on port 80.

The test is the pair of `curl` commands above. If `http://` connects and `https://` is refused, you need a certificate and a listening 443 block, not a firewall change. This is a different failure from [ERR_SSL_PROTOCOL_ERROR](/blog/err-ssl-protocol-error), where something is listening on 443 and the TLS handshake itself breaks. Refused means nothing answered. A handshake error means something did.

<!-- hosting-card -->

## When it starts right after a move

ERR_CONNECTION_REFUSED is the most predictable error on this whole list, because the sequence that produces it is so common.

You set up a new server. You change the DNS record. Your domain now resolves to a machine that is running and has no idea it is supposed to serve your site. There is no virtual host for your domain, so depending on the configuration you get a refusal, a default page, or somebody else's site. Most of the time there is no certificate either, so port 443 refuses outright.

Two things make it worse than it needs to be. The first is that DNS does not switch for everyone at once, so the site is refused for part of your audience and fine for the rest, which makes it look intermittent and random. [How long DNS propagation really takes](/blog/dns-propagation-time-what-actually-happens) explains what sets that window, and [flushing your DNS cache](/blog/how-to-flush-dns) stops your own machine from handing you stale answers while you test.

The second is the ordering trap. Most certificate authorities want the hostname pointing at the machine before they will issue a certificate, so you cannot finish HTTPS until DNS moves, and you should not move DNS until HTTPS works.

The way out is to load the new server under its real domain before you change any records. [DNS Previewer](/) does that free, and because it will reach your server over plain HTTP when HTTPS is not ready yet, you can confirm the site itself is being served correctly and deal with the certificate separately. The [WordPress migration checklist](/blog/wordpress-migration-checklist-test-before-dns) covers the rest of the pre-flight list.

## The order I'd work through it

1. Do other sites load? If yes, stop looking at your computer.
2. If every site is refused, check for a proxy or VPN that is configured but not running.
3. If the site is yours, run `curl -v http://yourdomain.com` and `curl -v https://yourdomain.com` and note which one fails.
4. One scheme works and the other is refused: that is cause 5, and it is a certificate and `listen 443` job.
5. Both refused: run `systemctl status nginx` and `nginx -t` on the server.
6. The service is running: run `ss -tlnp` and confirm it is bound to `0.0.0.0` on the port you expect, not to `127.0.0.1`.
7. Still refused, and the failure is instant: stay on the service, not the firewall. A drop rule would have given you a timeout.
8. Only now check `ufw status verbose` and your cloud provider's firewall for an explicit reject.

The error is telling you something precise, which makes it one of the easier failures to chase down. A machine answered, and nothing was home on the port you asked for. Work out what should have been listening there, and you have found the problem.
