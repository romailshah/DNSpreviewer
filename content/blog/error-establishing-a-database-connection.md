---
title: "Error establishing a database connection: how to fix it"
seoTitle: "Error Establishing a Database Connection in WordPress"
description: "Error establishing a database connection nearly always means wrong details in wp-config.php or a database server that won't answer. How to tell which, and fix it."
publishedAt: "2026-09-16"
author: "Romail Shah"
authorBio: "Romail Shah is a full-stack developer and the founder of DNS Previewer, a free tool for checking a website on a new server before you change DNS. He builds and migrates client sites for a living."
category: "WordPress"
tags: ["wordpress", "troubleshooting", "database", "mysql", "migration", "hosting"]
keywords:
  [
    "error establishing a database connection",
    "wordpress error establishing a database connection",
    "wp error establishing a database connection",
    "error establishing a database connection meaning",
    "how to fix error establishing a database connection",
    "wordpress database connection error",
    "cannot select database wordpress",
    "wp-config.php database settings",
    "wordpress repair database",
  ]
faqs:
  - q: "How do I fix an error establishing a database connection?"
    a: "Start with wp-config.php, because that's where the fault usually is. Check DB_NAME, DB_USER, DB_PASSWORD and DB_HOST against what your host's control panel shows, then test those exact details with a database client or the mysql command. If they're right and the connection still fails, the database server itself isn't answering, and that's one for your host. The two cases need completely different fixes, so it's worth spending a minute working out which one you've got before changing anything."
  - q: "What does error establishing a database connection mean?"
    a: "It means WordPress couldn't open a connection to MySQL, so it can't read a single post, page or setting. WordPress says as much in the error itself: either the username and password in wp-config.php are wrong, or contact with the database server couldn't be established. The site files are usually fine. Nothing has been deleted. WordPress just has no database to talk to, so it shows that page instead of your site."
  - q: "Why am I getting a database error when nothing changed?"
    a: "Something changed somewhere, even if it wasn't you. The usual culprits are a host migrating your account to a new server, a password reset in the control panel, a plugin or security tool rotating database credentials, a database hitting its storage quota, or the server running out of connections at a busy moment. If the error comes and goes rather than sticking around, it's almost always load or a quota, not your configuration."
  - q: "Why isn't my WordPress site connecting to the database?"
    a: "There are five common reasons: the credentials in wp-config.php don't match the database, DB_HOST is set to something this host doesn't use, the database user has no permission on that database, the database server is down or over quota, or the tables themselves are corrupted. WordPress shows a different message for some of these. 'Cannot select database' means the login worked but the database name or the user's permissions are wrong, which narrows things down a lot."
  - q: "How do I know if it's my fault or my host's?"
    a: "Try connecting with the same credentials outside WordPress, using a database client or `mysql -h your_host -u your_user -p`. If that connects, your details are fine and the problem is inside WordPress. If it's refused, the credentials are wrong. If it hangs or times out, the database server isn't reachable, and your host needs to look at it. That one test separates the two halves of this problem in about thirty seconds."
  - q: "Can I fix a corrupted database without a backup?"
    a: "Often yes. WordPress has a repair tool built in. Add define('WP_ALLOW_REPAIR', true); to wp-config.php, visit /wp-admin/maint/repair.php, and pick Repair Database. Remove that line as soon as you're done, because while it's there anyone can reach that page without logging in. If repair doesn't fix it, then you do need the backup, which is a good argument for checking that your backups actually restore."
  - q: "Why does the error appear only sometimes?"
    a: "An error that comes and goes points at connection limits rather than configuration. Wrong credentials fail every single time. MySQL allows a set number of connections at once, 151 by default, and when they're all in use new connections get refused with 'Too many connections'. On shared hosting you're sharing that ceiling with other sites. So the site breaks under traffic, recovers a minute later, and looks fine when you check."
---

Your site was working. Now every page shows "Error establishing a database connection" on a white background, with no menu, no styling and no way into wp-admin. It's alarming out of proportion to what's usually wrong.

Here's the short version. WordPress keeps your posts, pages, settings and users in a MySQL database, and it keeps the login details for that database in a file called `wp-config.php`. This error means WordPress tried to use those details, got nowhere, and gave up. Your files are still there. Your content is almost certainly still there. WordPress just can't reach it.

Most of the time the fix takes about ten minutes, and it's one of two things: the details in `wp-config.php` are wrong, or the database server isn't answering. Work out which one you've got first, because the fixes have nothing in common.

## What WordPress is actually telling you

The error page is short, but the wording is a clue. WordPress says the problem "either means that the username and password information in your `wp-config.php` file is incorrect or that contact with the database server at [your host] could not be established", then asks three questions:

- Are you sure you have the correct username and password?
- Are you sure you have typed the correct hostname?
- Are you sure the database server is running?

Those three questions are the whole diagnosis. The first two are your side. The third is your host's.

There's a second message worth knowing about, because it looks similar and means something different. If you see **Cannot select database** instead, the login worked. WordPress reached the server, the username and password were accepted, and then it couldn't open the database you named. That points at a wrong `DB_NAME`, or a database user with no permission on it. It's a much narrower problem, and you can skip most of this article.

## The one test that splits the problem in half

Before changing anything, find out whether those credentials work outside WordPress. If you have SSH access:

```
mysql -h localhost -u your_db_user -p your_db_name
```

It'll ask for the password. What happens next tells you where you stand:

- A `mysql>` prompt means the credentials are fine and the server is up, so your problem is inside WordPress and `wp-config.php` probably doesn't hold these details.
- Access denied means the username, the password, or that user's permission on this database is wrong.
- A long pause and then a timeout means the server isn't reachable at that hostname, so either `DB_HOST` is wrong or the database server is down.

No SSH? Your host's phpMyAdmin does the same job. Log into it with the database user rather than your control panel account. If phpMyAdmin also refuses, the credentials are the problem.

If WP-CLI is installed, there's a quicker version:

```
wp db check
```

That [runs the `mysqlcheck` utility](https://developer.wordpress.org/cli/commands/db/check/) using the credentials in `wp-config.php`, so it fails in exactly the same way WordPress does, only with a useful error message instead of a blank page.

## Cause 1: wrong details in wp-config.php

This is the big one, and it's nearly always the answer after a site moves to a new host.

Open `wp-config.php` in the WordPress folder. Near the top you'll find four lines:

```php
define( 'DB_NAME', 'database_name_here' );
define( 'DB_USER', 'username_here' );
define( 'DB_PASSWORD', 'password_here' );
define( 'DB_HOST', 'localhost' );
```

Compare each one against what your host's control panel shows under MySQL databases. With WP-CLI you can read them without opening the file:

```
wp config get DB_HOST
```

A few things that catch people out:

The database name and user often carry a prefix. Plenty of shared hosts prepend your account name, so the database you created as `clientsite` is really `acct123_clientsite`. WordPress even hints at this in its "Cannot select database" message. Copy the full name from the control panel rather than typing what you remember.

A new password sometimes never makes it into the file. If you reset the database user's password to get back in, the old one is still sitting in `wp-config.php`. Reset it, then paste the new password into the file.

Quotes and special characters cause their own trouble. Passwords with a single quote or a backslash need escaping inside the single-quoted string, and it's easier to generate a password without them. If you pasted from a password manager, check there's no trailing space inside the quotes.

Then there's the user who exists but has no rights on the database. On cPanel and similar panels, creating a user and creating a database are two steps, and a third step attaches one to the other with privileges. Miss that third step and everything looks correct while nothing works.

Once you change the file, load the site again. There's nothing to clear and nothing to restart.

## Cause 2: DB_HOST is right for the old server, wrong for this one

`DB_HOST` deserves its own section, because it's the line people leave alone and the line that breaks a migration.

WordPress ships with `localhost`, and as the documentation puts it, "there is a good chance you will NOT have to change it". That's true when the database runs on the same machine as the site. Plenty of hosts don't work that way. Managed hosts, cloud databases and anything with a separate database server need a hostname you'll find in the control panel, something like `mysql.yourhost.com` or an internal address.

Non-standard setups have their own formats, both [documented by WordPress](https://developer.wordpress.org/apis/wp-config-php/):

```php
define( 'DB_HOST', '127.0.0.1:3307' );
define( 'DB_HOST', '127.0.0.1:/var/run/mysqld/mysqld.sock' );
```

The first is a port. The second is a socket file. If your host's documentation gives you either of those, use it exactly as written.

One more detail that wastes hours: `localhost` and `127.0.0.1` are not always interchangeable. On Unix systems, MySQL [treats `localhost` specially](https://dev.mysql.com/doc/refman/8.4/en/connecting.html) and connects through a socket file, while `127.0.0.1` goes over TCP, and a MySQL user can be granted one and not the other. If one is refused, try the other before assuming the password is wrong.

## Cause 3: the database server is down or out of room

If the credentials test fine outside WordPress but the site still fails, the problem isn't yours to fix. WordPress lists two host-side causes in its own troubleshooting guide: [your database has hit its quota and been shut down, or the server is down](https://developer.wordpress.org/advanced-administration/wordpress/common-errors/).

Quotas are worth checking yourself, because they creep up on you. A database that fills with post revisions, transients or a chatty logging plugin can pass a storage limit without anyone noticing, and the shutdown is abrupt.

Then there's the version that drives people mad: the error that shows up, disappears, and comes back at the worst moment. That pattern almost always means connection limits. MySQL only accepts so many connections at once, [151 by default](https://dev.mysql.com/doc/refman/8.4/en/server-system-variables.html), and once they're taken, new ones are refused with "Too many connections". On shared hosting that ceiling is shared with your neighbours, so a busy hour on someone else's site can knock yours over.

Wrong credentials fail every time, without exception. So an error that appears and clears on its own is a strong signal to stop editing `wp-config.php` and talk to your host, with the times it happened written down.

## Cause 4: the tables are corrupted

Less common, but it does happen after an interrupted migration, a failed import or a server that lost power mid-write.

WordPress has a repair tool for exactly this. Add one line to `wp-config.php`:

```php
define( 'WP_ALLOW_REPAIR', true );
```

Then visit `https://yoursite.com/wp-admin/maint/repair.php`. You'll get two buttons, Repair Database and Repair and Optimize Database. Repair alone is the quicker of the two, which matters when the site is down.

Now the important part. WordPress warns that this "should only be enabled if needed and disabled once the issue is solved", because while that line is in place the page works without anyone logging in. That's deliberate, since a corrupted database usually means nobody can log in, but it also means anyone who finds the URL can run it. Delete the line the moment you're finished.

## Cause 5: someone else has been in

If the credentials are correct, the server is healthy and the tables are fine, WordPress suggests [checking whether the site has been compromised](https://developer.wordpress.org/advanced-administration/wordpress/common-errors/). Attackers sometimes change database details to break a site, or leave a mess behind that does it by accident.

It's the least likely cause on the list, so treat it as the last stop rather than the first. If you get there, scan the site properly and change every password, starting with hosting and database.

## If this started right after a migration

Then you've almost certainly got cause 1 or cause 2, and there's a specific reason why.

Copying a site to a new server means copying `wp-config.php` too. That file carries the old server's database name, user, password and host, none of which mean anything on the new machine. The site sits there looking fine while DNS still points at the old server, then the moment you switch DNS, every visitor gets a database error instead of a website.

The fix is to check the new server properly before you change DNS, under the real domain, not just by loading a temporary URL. The [WordPress migration checklist](/blog/wordpress-migration-checklist-test-before-dns) goes through the eighteen things worth confirming, and the database credentials are number three on it for good reason.

Testing that is easier than it used to be. [DNS Previewer](/) gives you a link that loads your site from the new server under its real domain name, before you touch a single DNS record. If `wp-config.php` still has the old details, you get this error on a private preview link that only you have seen, rather than in front of every customer. It's free, and the link opens on any device. Editing your hosts file does the same job on one machine, and [where that approach falls short](/blog/preview-website-new-server-without-hosts-file) covers the trade-offs.

## A quick order of work

If you want this as a list to run through:

1. Note whether the message says "Error establishing a database connection" or "Cannot select database". The second one narrows it immediately.
2. Test the credentials outside WordPress, with `mysql` or phpMyAdmin.
3. If they fail, fix `DB_NAME`, `DB_USER` and `DB_PASSWORD` in `wp-config.php` from the control panel, and check the user has privileges on that database.
4. If they connect from elsewhere but not from the site, look hard at `DB_HOST`.
5. If nothing connects, check your host's status page and your database quota, then open a ticket.
6. If the site half works and the admin is broken, try the repair tool, then remove the line.

Nine times out of ten you'll be back at step 3, changing one line, wondering how something so small took the whole site down.
