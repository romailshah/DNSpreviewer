# Operations runbook — dnspreviewer.com

How the live service is deployed, backed up, monitored, and defended. If you're
setting up your own instance on a VPS instead, see [DEPLOYMENT.md](DEPLOYMENT.md).

---

## Where it runs

| Thing | Value |
|---|---|
| Platform | Fly.io, app `dnspreviewer` |
| Config | `fly.toml` |
| Region | `sin` (Singapore) |
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
  TURNSTILE_SITE_KEY="0x4AAA..." \
  TURNSTILE_SECRET_KEY="0x4AAA..." \
  BACKUP_S3_ENDPOINT="https://<account>.r2.cloudflarestorage.com" \
  BACKUP_S3_BUCKET="dnspreviewer-backups" \
  BACKUP_S3_ACCESS_KEY_ID="..." \
  BACKUP_S3_SECRET_ACCESS_KEY="..."
```

`CRON_SECRET` must also be added as a **GitHub repository secret** of the same
name, because the scheduler lives in GitHub Actions (see below).

---

## Backups

### How it works

`POST /api/cron/backup` (bearer-authenticated with `CRON_SECRET`):

1. Takes a consistent snapshot with SQLite's online backup API — no downtime.
2. Runs `PRAGMA quick_check` on the copy. A backup that captured a corrupt page
   is worse than none, because it stops you looking.
3. Gzips it and PUTs it to an S3-compatible bucket at
   `<prefix>/<year>/<month>/dnspreviewer-<timestamp>.db.gz`.
4. Records a `backup.succeeded` row in the activity log, which is what the
   staleness check reads.

The scheduler is `.github/workflows/ops.yml`, running daily at 03:15 UTC. It has
to be external: the Fly machine sleeps when idle, so an in-process timer would
only fire while someone happened to be using the site. The HTTP call wakes the
machine and does the work.

Backups fail **closed** — with `CRON_SECRET` unset, the endpoint refuses
everything rather than letting anyone trigger a dump.

### One-time bucket setup

Any S3-compatible bucket works (Cloudflare R2, Backblaze B2, AWS S3, Wasabi).
R2 is the cheapest sane default — no egress fees, generous free tier.

1. Create a **private** bucket, e.g. `dnspreviewer-backups`.
2. Create an access key scoped to just that bucket.
3. Add a **lifecycle rule: delete objects older than 90 days.** The backup job
   deliberately does not prune; retention is the bucket's job, so a bug in the
   app can never delete your history.

### Verify it works

```bash
# From your machine, against production:
curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
  https://dnspreviewer.com/api/cron/backup

# Or locally with the same env vars:
npm run backup
```

Then confirm the object actually landed in the bucket. A backup you have never
looked at is a hope, not a backup.

### Restore

SQLite keeps `-wal` and `-shm` sidecar files; a restore that leaves stale ones
behind will corrupt or silently revert your data.

```bash
# 1. Fetch and decompress the snapshot locally.
gunzip dnspreviewer-<timestamp>.db.gz

# 2. Upload it to the volume, alongside (not over) the live DB.
fly ssh sftp shell -a dnspreviewer
  put dnspreviewer-<timestamp>.db /data/restore.db
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

---

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
