---
title: "502 Bad Gateway: what it means and how to fix it"
seoTitle: "502 Bad Gateway Error: What It Means and How to Fix It"
description: "A 502 Bad Gateway means one server got an unusable answer from another. What to do as a visitor, and the four causes worth checking if the site is yours."
summary: "A 502 Bad Gateway means the server you reached could not get a usable response from the server behind it, so the fault is at the site's end rather than yours. If you are visiting, refresh and wait, because nothing on your computer will fix it. If the site is yours, read the proxy's error log first: it names the cause on one line, and the usual answer is that PHP-FPM or your app stopped answering."
publishedAt: "2026-09-17"
author: "Romail Shah"
authorBio: "Romail Shah is a full-stack developer and the founder of DNS Previewer, a free tool for checking a website on a new server before you change DNS. He builds and migrates client sites for a living."
category: "Troubleshooting"
tags: ["502", "nginx", "apache", "wordpress", "hosting", "troubleshooting"]
keywords:
  [
    "502 bad gateway",
    "502 bad gateway error",
    "what does 502 bad gateway mean",
    "how to fix 502 bad gateway",
    "502 bad gateway nginx",
    "502 bad gateway wordpress",
    "502 bad gateway meaning",
    "bad gateway error",
    "502 vs 504",
  ]
faqs:
  - q: "What does 502 Bad Gateway mean?"
    a: "It means the server you connected to was passing your request along to another server, and the answer that came back was unusable. The HTTP specification defines it as a server acting as a gateway or proxy receiving an invalid response from an inbound server. In plain terms, the front door answered, the room behind it didn't, so you got an error page instead of the site."
  - q: "Is a 502 error my fault or the website's?"
    a: "The website's, nearly always. It's a server error, and the servers in question belong to the site, not to you. MDN notes the exceptions: if the site works for everyone else, the problem can be your own network, a VPN, a proxy or your DNS settings. So try the page on mobile data. If it loads there and not on your home connection, look at your own network. If it fails everywhere, it's their end."
  - q: "How do I fix a 502 Bad Gateway error?"
    a: "As a visitor there's no fix. Refresh in a minute, and try another network to rule your own out. If the site is yours, open the web server's error log before changing anything, because the line it writes names the cause. The four usual answers are that PHP-FPM or your app isn't running, it ran out of workers, a request died part way through, or a proxy in front is pointing at the wrong place."
  - q: "What is the difference between 502 and 504?"
    a: "A 502 means the upstream server answered with something unusable. A 504 means it didn't answer in time. The specification is clear about it: 504 Gateway Timeout is for a gateway that did not receive a timely response. In practice a slow page that runs past the proxy's timeout gives you a 504, while a process that crashes or closes the connection mid-reply gives you a 502."
  - q: "Why does WordPress show 502 Bad Gateway?"
    a: "Usually because PHP-FPM, the process that actually runs WordPress, stopped answering nginx. It may have crashed, been killed for using too much memory, or run out of worker processes under load. The site files and database are untouched, which is why the error often clears on its own once the process restarts, then comes back the next time traffic picks up."
  - q: "Can DNS cause a 502 error?"
    a: "Indirectly, yes. If your domain now points at a server that isn't set up to serve it, or a proxy in front is still forwarding to the old machine, you can get a 502 even though both servers are running. That's a common one in the hours after a migration, and it's the reason to check the new server under your real domain before you change any DNS records."
  - q: "Does clearing my browser cache fix a 502?"
    a: "Rarely, because the error is generated on the server and nothing about it is stored by your browser. It's worth one hard refresh in case you cached the error page itself. Beyond that, clearing cookies, flushing DNS and restarting the router are all things people try that cannot fix a problem happening on someone else's machine."
---

A 502 Bad Gateway is one of those errors that tells you almost nothing on its own. The page is usually blank apart from the number, there's no clue about which part broke, and the wording sounds like it might be your fault. It isn't.

Two very different people hit this error. If you're trying to read a website and got stopped, skip to the next section and you'll be done in a minute. If the site is yours and it's down right now, the log-reading section is where the answer will be.

## What a 502 actually means

The HTTP specification defines 502 as a server "while acting as a gateway or proxy" receiving "an invalid response from an inbound server it accessed while attempting to fulfill the request."

That describes how almost every modern site is built. Your browser talks to a web server such as nginx, and nginx passes the request to something behind it: PHP-FPM for WordPress, Node for an app, another machine entirely. The front server answered you. The thing behind it did not answer properly. So the front server had nothing to send back, and 502 is what it says instead.

It's worth knowing the neighbours, because they point at different problems:

| Code | What it means | Typical cause |
|---|---|---|
| 502 Bad Gateway | The upstream server sent back something unusable | The process crashed or closed the connection |
| 504 Gateway Timeout | The upstream server didn't reply in time | A slow query or a page stuck in a loop |
| 503 Service Unavailable | The server itself can't handle the request now | Overload, or maintenance mode |

MDN puts 502 in the same family as a 500, calling it "a generic catch-all for server errors", with the difference being which point in the chain broke.

## If you're a visitor, not the owner

There is no fix on your side, and most of the advice you'll find is people repeating things that cannot work. The error happens on a machine you don't control.

Two things are worth a minute:

Refresh once after a short wait. Plenty of 502s last seconds, because a process restarts on its own. Give it a minute and try again.

Try the site from a different network, like mobile data instead of wifi. MDN is precise about the exception here: client networking is worth checking "particularly if the service works for other visitors", and if you use a VPN, a proxy or custom DNS settings. If the site loads on your phone's data but not at home, the problem is in your own setup. If it fails everywhere, it's theirs.

Clearing cookies, flushing DNS and restarting your router will not fix a 502. The only reason to hard refresh is that your browser may have cached the error page itself.

## If the site is yours, read the log first

The single biggest time waster here is changing things before looking. Your web server writes a line for every 502 it generates, and that line usually names the cause outright.

On nginx, that's the error log, normally at `/var/log/nginx/error.log`:

```
sudo tail -50 /var/log/nginx/error.log
```

Three phrases come up again and again, and they mean different things.

`connect() failed (111: Connection refused) while connecting to upstream` means nothing is listening where nginx expects. The app is down, or the config points at the wrong port or socket file.

`upstream prematurely closed connection` means the process accepted the request and then died before finishing the reply. That's a crash, a fatal error, or something killing the worker part way through.

`no live upstreams` means nginx has already given up on every backend in the pool after repeated failures.

On Apache with mod_proxy, check the site's error log for the proxy's own complaints. Apache also returns 502 when the backend sends a malformed response: the `ProxyBadHeader` directive controls how it handles "syntactically invalid response header lines", and returning 502 is the default behaviour.

## Cause 1: the process behind the web server isn't running

This is the most common cause on a WordPress or PHP site, and it goes with the "Connection refused" line above.

Check whether PHP-FPM is actually up:

```
sudo systemctl status php8.3-fpm
sudo systemctl restart php8.3-fpm
```

Adjust the version to match yours. If restarting brings the site back, the interesting question is why it stopped, and the PHP-FPM log will tell you. On Node, Python or Ruby apps the same logic applies to whatever process manager you use.

If the service is running and you still get 502, the two are talking past each other. Compare the socket or port in your nginx config against the one PHP-FPM is listening on:

```
grep fastcgi_pass /etc/nginx/sites-available/*
grep -E "^listen" /etc/php/8.3/fpm/pool.d/www.conf
```

Those two have to match exactly. A PHP upgrade that moves the socket from `php8.2-fpm.sock` to `php8.3-fpm.sock` while nginx still points at the old path is a classic way to lose a site for an hour.

## Cause 2: it ran out of workers

If the error shows up at busy times and clears when traffic drops, you've probably hit the process limit rather than a crash.

PHP-FPM runs a fixed pool of child processes, capped by `pm.max_children`, and the PHP documentation describes that setting as the limit "on the number of simultaneous requests that will be served". When they're all busy, new requests queue, and if that goes on long enough, nginx gives up and returns 502.

PHP-FPM says so plainly in its log. The exact wording in the PHP source is:

```
server reached pm.max_children setting (%d), consider raising it
```

Search your PHP-FPM log for that phrase. If it's there, you have your answer. Raising the limit is the obvious move, though each child uses memory, so raising it past what the machine has just trades one failure for a worse one. The other half of the job is making the slow pages faster, usually with caching.

## Cause 3: something died mid-request

The `upstream prematurely closed connection` case usually comes down to one of three things.

A PHP fatal error, which lands in the PHP error log rather than nginx's.

The server's out of memory killer stopping the process, which you can check with `dmesg | grep -i "killed process"`. This happens on small servers running an import, a backup plugin or an image-heavy job.

PHP-FPM killing the worker itself. `request_terminate_timeout` exists for exactly that, described in the PHP docs as "the timeout for serving a single request after which the worker process will be killed". If a request passes it, the worker goes away mid-reply and you get a 502.

Timeouts are where 502 and 504 get mixed up, so it's worth being precise. nginx waits `proxy_read_timeout` for a reply, and the default is 60 seconds. Apache's `ProxyTimeout` defaults to its `TimeOut` value, which is also 60 seconds. When the backend is simply slow and that clock runs out, the right answer is 504. You get a 502 when the process stops talking altogether.

## Cause 4: a proxy or CDN in front is pointing at the wrong place

If you use Cloudflare, it helps to know who generated the page you're looking at. Cloudflare's own documentation draws the line clearly: an error generated by Cloudflare appears as "a blank page without the Cloudflare branding", while an error generated by your origin comes back "Cloudflare-branded". So a branded page means your server produced the 502 and the sections above apply. An unbranded one points at Cloudflare's side, and their documentation lists causes like compression problems at the origin, with `yourdomain.com/cdn-cgi/trace` as the thing to send their support team.

The same logic covers any load balancer or reverse proxy you run yourself. If it's still forwarding to an IP address or container that no longer exists, every request ends in a 502 while both machines look perfectly healthy from the outside.

## When it started right after a migration

This is where a 502 stops being a mystery and starts being predictable.

You move a site to a new server, change the DNS record, and within minutes the error shows up. Both servers are running. Nothing crashed. What usually happened is that the new machine isn't configured to serve your domain the way the old one was: the virtual host doesn't match, PHP-FPM isn't running for that pool, or a proxy in front of it is still aimed at the old address.

DNS makes it harder to diagnose, because the switch isn't instant. Some visitors reach the new server while others still land on the old one, so the site is broken for part of your audience and fine for the rest. [How long DNS propagation really takes](/blog/dns-propagation-time-what-actually-happens) explains what sets that window, and [flushing your DNS cache](/blog/how-to-flush-dns) stops your own machine from lying to you while you test.

The way to avoid the whole situation is to load the new server under your real domain before any DNS record changes. [DNS Previewer](/) gives you a link that does exactly that, free, so a 502 shows up on a preview link that only you can see rather than on your live site. The [WordPress migration checklist](/blog/wordpress-migration-checklist-test-before-dns) covers the rest of what's worth confirming first, and a wrong database connection produces [its own distinct error](/blog/error-establishing-a-database-connection) rather than a 502, which is a useful way to tell the two apart.

## The short order of work

1. Check whether it's just you, by loading the site on another network.
2. If the site is yours, read `/var/log/nginx/error.log` and note which of the three phrases appears.
3. Connection refused points at a dead process or a wrong socket or port.
4. Prematurely closed points at a crash, memory, or a worker being killed.
5. An error that follows your traffic points at `pm.max_children`.
6. If Cloudflare is in front, check whether the error page carries their branding before blaming your server.

Most 502s come down to one process that stopped answering. The log line tells you which one, and everything after that is ordinary maintenance.
