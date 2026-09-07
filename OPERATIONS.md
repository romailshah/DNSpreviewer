# Operations runbook — dnspreviewer.com

How the live service is deployed, backed up, monitored, and defended. If you're
setting up your own instance on a VPS instead, see [DEPLOYMENT.md](DEPLOYMENT.md).

---

## Where it runs

| Thing | Value |
|---|---|
| Platform | Fly.io, app `dnspreviewer` |
| Config | `fly.toml` |
| Region | `iad` (US East, Virginia) |
| Machine | 1 × `shared-cpu-1x`, 512 MB, sleeps when idle |
| State | SQLite at `/data/dnspreviewer.db` on the `dnspreviewer_data` volume |
| TLS | Fly-managed wildcard cert for `*.dnspreviewer.com` |

**Everything the service owns is in that one SQLite file** — user accounts,
preview links (including no-expiry ones), auth sessions, the activity log.
There is exactly one copy on one volume. That is why the backup job below is not
optional.

### Deploy

```bash
fly deploy
```

The volume persists across deploys. `fly logs` to watch, `fly status` for machine
state.

---

## Secrets and configuration

Non-secret settings live in `[env]` in `fly.toml`. Everything below is set with
`fly secrets set` (each call restarts the machine, so set them in one command):

```bash
fly secrets set \
  AUTH_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" \
  CRON_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" \
  BACKUP_ENCRYPTION_KEY="<64 hex chars, saved in your password manager first>" \
  BACKUP_GITHUB_TOKEN="github_pat_..." \
  BACKUP_GITHUB_REPO="romailshah/dnspreviewer-backups" \
  TURNSTILE_SITE_KEY="0x4AAA..." \
  TURNSTILE_SECRET_KEY="0x4AAA..."
```

`CRON_SECRET` must also be added as a **GitHub repository secret** of the same
name on the application repo, because the scheduler lives in GitHub Actions.

`BACKUP_GITHUB_TOKEN` should be a fine-grained token scoped to the backup repo
alone, with Contents: read and write. If it ever leaks, the blast radius is one
private repo of encrypted files rather than your source code.

---

## Backups

### What is in the file, and why that matters

The database holds user email addresses, bcrypt password hashes, auth session
tokens, preview targets and the creator IP for every preview. Any destination
you send it to must be private, and the dump is encrypted before it leaves the
machine so a mistake at the destination is not immediately a breach.

**Never point a backup at the public application repo.**

### How it works

`POST /api/cron/backup` (bearer-authenticated with `CRON_SECRET`):

1. Takes a consistent snapshot with SQLite's online backup API. No downtime.
2. Runs `PRAGMA quick_check` on the copy. A backup that captured a corrupt page
   is worse than none, because it stops you looking.
3. Gzips it, then encrypts with AES-256-GCM using `BACKUP_ENCRYPTION_KEY`.
4. Uploads to every configured destination: a private GitHub repo, an
   S3-compatible bucket, or both.
5. Prunes old backups on GitHub down to `BACKUP_GITHUB_KEEP` (default 90).
6. Records a `backup.succeeded` row, which is what the staleness check reads.

The scheduler is `.github/workflows/ops.yml`, daily at 03:15 UTC. It has to be
external: the Fly machine sleeps when idle, so an in-process timer would only
fire while someone happened to be using the site. The HTTP call wakes the
machine and does the work.

Backups fail **closed**. With `CRON_SECRET` unset the endpoint refuses
everything rather than letting anyone trigger a dump of your user table.

### Encrypted file format

`DNSPBK` (6 bytes) | version (1) | IV (12) | GCM auth tag (16) | ciphertext

Decryption fails loudly on a wrong key or a tampered file rather than returning
garbage. The `.db.gz.enc` extension is a convenience; the restore script detects
the magic header rather than trusting the filename.

### One-time setup

**Private GitHub repo**

1. Create a new **private** repo, for example `dnspreviewer-backups`, with a
   README so the default branch exists.
2. Create a fine-grained personal access token scoped to **only that repo**,
   with **Contents: read and write**. Nothing else.
3. Set the secrets on Fly (see Secrets and configuration above).

**Encryption key**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Put it in your password manager first, then set it as a Fly secret. If you lose
this key every backup is permanently unreadable. That is the deal encryption
makes and there is no recovery path around it.

### Verify it works

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
  https://dnspreviewer.com/api/cron/backup
```

Then confirm the file actually appeared in the repo. A backup you have never
looked at is a hope, not a backup.

### Restore

```bash
# 1. Download the backup from the repo, then turn it back into a database.
BACKUP_ENCRYPTION_KEY=<your key> \
  npx tsx scripts/restore-backup.ts dnspreviewer-<timestamp>.db.gz.enc restored.db
```

That decrypts, decompresses and integrity-checks the file, and prints the user
and preview counts so you can confirm you grabbed the right one before going
further.

SQLite keeps `-wal` and `-shm` sidecar files. A restore that leaves stale ones
behind will corrupt or silently revert your data.

```bash
# 2. Upload it to the volume, alongside (not over) the live database.
fly ssh sftp shell -a dnspreviewer
  put restored.db /data/restore.db
  exit

# 3. Swap it in and clear the sidecars.
fly ssh console -a dnspreviewer -C "sh -c '
  mv /data/dnspreviewer.db /data/dnspreviewer.db.bak &&
  rm -f /data/dnspreviewer.db-wal /data/dnspreviewer.db-shm &&
  mv /data/restore.db /data/dnspreviewer.db'"

# 4. Restart so the app opens the restored file.
fly apps restart dnspreviewer
```

Keep `dnspreviewer.db.bak` until you have confirmed the restore is good.

## Monitoring

### `/api/health`

- `GET /api/health` — fast. Database reachable, row counts, whether backups and
  captcha are configured. Suitable for a 5-minute uptime monitor.
- `GET /api/health?deep=1` — also checks that the last successful backup is under
  36 hours old and that the wildcard certificate has more than 21 days left.
  Returns **503** when either fails.

The certificate check earns its place: a failed wildcard renewal breaks *every
preview link* while the marketing site keeps happily returning 200. Without this,
the product is broken and every dashboard is green.

### What to set up

1. **UptimeRobot (free)** — two HTTP monitors:
   - `https://dnspreviewer.com/api/health`
   - a permanent no-expiry preview link pointed at a host you control. This is
     the one that catches "site up, proxying broken". Create it from the
     dashboard while logged in and label it `canary — do not delete`.
2. **GitHub Actions** — `ops.yml` already runs the deep check daily and fails the
   job (which emails you) on a stale backup or an expiring certificate.

---

## Abuse response

A wildcard preview domain is attractive to phishers: it hands them a clean
HTTPS subdomain on someone else's domain. If one phishing page gets
`dnspreviewer.com` flagged by Google Safe Browsing, **every preview link and the
marketing site go dark at once**, and delisting takes days. Defence in depth:

| Layer | Where | Notes |
|---|---|---|
| Built-in blocklist | `lib/blocklist.ts` | Banks, webmail, payment, IdPs, dev hosts. Suffix-matched, so `login.paypal.com` is covered by `paypal.com`. Checked against **both** the previewed domain and the upstream target. |
| Runtime additions | `BLOCKED_HOSTS` secret | Comma-separated. Add new targets as you see them. |
| Exceptions | `BLOCKED_HOSTS_ALLOW` | For a customer who genuinely owns a listed domain. |
| Captcha | Turnstile, anonymous creates only | Disabled automatically when keys are unset. Fails open if Cloudflare is unreachable — rate limits and the blocklist still apply. |
| Rate limit | `RATE_LIMIT_PER_HOUR` (10) | Per IP, anonymous only. Drop to 3 under active abuse. |
| SSRF guards | `lib/security.ts` | Private ranges + cloud metadata. **Never weaken these.** |
| Audit trail | `preview.blocked` activity rows | Blocked attempts show in the admin activity feed — that's your early warning that someone is probing. |

### When a report arrives

1. Find the preview in `/admin` and **disable** it (don't delete — you may need
   the record).
2. Add the abused domain to `BLOCKED_HOSTS` and redeploy the secret.
3. Check the reporter's claim against Safe Browsing:
   <https://transparencyreport.google.com/safe-browsing/search?url=dnspreviewer.com>
4. Reply to the reporter. `abuse@dnspreviewer.com` must reach an inbox a human
   actually reads — this is the single cheapest thing standing between one
   report and a domain-wide blacklist.

---

## Routine maintenance

Expired preview rows and activity-log rows older than 90 days are swept
automatically by the daily backup job, so there is nothing to run by hand. The
`scripts/` helpers are not shipped in the standalone container image — run them
locally against a restored copy if you need them ad hoc.

Dependency and security updates are the one recurring manual task:

```bash
npm outdated
npm audit
```

Grant yourself admin with `npm run make-admin -- <email>` (run locally, against
the production DB path or a restored copy).
