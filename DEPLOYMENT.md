# Production deployment

End-to-end guide for hosting DNS Previewer at `dnspreviewer.com` with a wildcard TLS certificate so previews like `abc123.dnspreviewer.com` work over HTTPS.

**Total time:** ~45 minutes. **Monthly cost:** ~€5 for the VPS, free DNS & TLS.

---

## 1. Provision a VPS

Any Linux VPS with a public IPv4 works. Recommended:

| Provider | Plan | Approx. price |
|---|---|---|
| Hetzner Cloud | CX22 (2 vCPU / 4 GB) | €4.50/mo |
| DigitalOcean | Basic Droplet 2 GB | $12/mo |
| Vultr | Regular 2 GB | $6/mo |

Go with **Ubuntu 24.04 LTS**. 2 GB RAM is comfortable; 1 GB works but leaves little headroom for traffic spikes.

Note the server's **public IPv4 address** — you'll need it in step 2.

## 2. Point DNS at the server — via Cloudflare

Using Cloudflare for DNS is strongly recommended because:
- Free
- Has an API that Caddy uses to issue a wildcard TLS cert automatically
- Handles DDoS protection

### 2a. Add the domain to Cloudflare

1. Sign up at https://cloudflare.com (free plan).
2. Click **Add site**, enter `dnspreviewer.com`.
3. Cloudflare shows you two nameservers (e.g. `chad.ns.cloudflare.com`, `rita.ns.cloudflare.com`).
4. Go to your registrar (wherever you bought `dnspreviewer.com`) and change the domain's nameservers to those two. Propagation takes 1–24 hours.

### 2b. Add DNS records

In Cloudflare → DNS → Records, add:

| Type | Name | Content | Proxy status |
|---|---|---|---|
| A | `@` | `YOUR_VPS_IP` | DNS only (grey cloud) |
| A | `*` | `YOUR_VPS_IP` | DNS only (grey cloud) |
| A | `www` | `YOUR_VPS_IP` | DNS only (grey cloud) |

**Important:** Leave proxy status as **DNS only** (grey cloud). If you turn on the orange cloud, Cloudflare terminates TLS itself — which means your preview subdomains share Cloudflare's cert instead of your own, and long-running streams may be rewritten.

### 2c. Create a Cloudflare API token for Caddy

1. Cloudflare → **My Profile → API Tokens → Create Token**.
2. Use template **Edit zone DNS**. Zone: `dnspreviewer.com`. Create.
3. Copy the token — you'll paste it into Caddy's config.

## 3. Base server setup

SSH in as root and run:

```bash
apt update && apt upgrade -y
apt install -y ufw curl git

# Firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# A non-root user for the app
useradd -m -s /bin/bash dnsp
```

## 4. Install the app

```bash
sudo -iu dnsp
git clone https://github.com/YOUR-GITHUB/dnspreviewer.git app
cd app
npm ci
npm run build

AUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

cat > .env <<EOF
ROOT_DOMAIN=dnspreviewer.com
SESSION_TTL_MINUTES=15
RATE_LIMIT_PER_HOUR=10
MAX_REWRITE_MB=4
AUTH_SECRET=$AUTH_SECRET
DATABASE_PATH=/home/dnsp/data/dnspreviewer.db
EOF

mkdir -p /home/dnsp/data

exit
```

**Keep `AUTH_SECRET` stable across deploys** — rotating it logs everyone out and invalidates all password-unlock cookies on live previews. If you ever need to rotate it, do so during planned maintenance.

**Back up `/home/dnsp/data/dnspreviewer.db`** — this is your only stateful asset (users + active previews). A nightly rsync to a second host or cloud storage is plenty.

## 5. Run it as a systemd service

As root, `/etc/systemd/system/dnspreviewer.service`:

```ini
[Unit]
Description=DNS Previewer
After=network.target

[Service]
Type=simple
User=dnsp
WorkingDirectory=/home/dnsp/app
EnvironmentFile=/home/dnsp/app/.env
ExecStart=/usr/bin/node node_modules/next/dist/bin/next start -p 3000
Restart=always
RestartSec=5
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable --now dnspreviewer
systemctl status dnspreviewer
```

Check it's listening: `curl -s http://127.0.0.1:3000 | head` should show HTML.

## 6. Caddy as the edge reverse proxy + wildcard TLS

Caddy handles TLS termination, wildcard cert issuance via Cloudflare DNS-01, and proxies everything to Node on `:3000`.

### Install Caddy with the Cloudflare DNS module

```bash
# Install xcaddy to build Caddy with the plugin
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install -y caddy

# Replace the binary with one that includes the Cloudflare DNS module
curl -fsSL https://github.com/caddyserver/xcaddy/releases/download/v0.4.2/xcaddy_0.4.2_linux_amd64.deb -o /tmp/xcaddy.deb
apt install -y /tmp/xcaddy.deb
xcaddy build --with github.com/caddy-dns/cloudflare --output /usr/bin/caddy
systemctl restart caddy
```

### Configure Caddy

Edit `/etc/caddy/Caddyfile`:

```caddy
{
    email you@example.com
}

dnspreviewer.com, www.dnspreviewer.com {
    encode gzip
    reverse_proxy 127.0.0.1:3000
}

*.dnspreviewer.com {
    tls {
        dns cloudflare PASTE_YOUR_CLOUDFLARE_TOKEN_HERE
    }
    encode gzip
    reverse_proxy 127.0.0.1:3000 {
        header_up Host {host}
        header_up X-Forwarded-Proto {scheme}
        header_up X-Forwarded-For {remote}
    }
}
```

Validate and reload:

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

First load of `https://anything.dnspreviewer.com` triggers Caddy to request the wildcard cert. Watch progress in `journalctl -u caddy -f`. You should see ACME DNS-01 challenge success.

## 7. Smoke test

From your laptop:

```bash
# Apex
curl -I https://dnspreviewer.com/
# -> HTTP/2 200

# Random subdomain (no session yet)
curl -I https://testabc.dnspreviewer.com/
# -> HTTP/2 404  "Preview not found"
```

Then open https://dnspreviewer.com/create in a browser, create a preview for a real domain + IP you control, and visit the preview URL it generates.

## 8. Ongoing ops

### Updating the app

```bash
sudo -iu dnsp
cd app
git pull
npm ci
npm run build
exit
systemctl restart dnspreviewer
```

### Logs

- App: `journalctl -u dnspreviewer -f`
- Caddy: `journalctl -u caddy -f`

### Backups

The app stores state in a SQLite file at `DATABASE_PATH` (default `/home/dnsp/data/dnspreviewer.db`). Everything lives there: user accounts, active previews (including no-expiry ones), auth sessions. Back it up.

Simple nightly backup with `cron`:

```bash
# crontab -e on the VPS, as root
0 3 * * * sqlite3 /home/dnsp/data/dnspreviewer.db ".backup '/home/dnsp/data/backup-$(date +\%F).db'" && find /home/dnsp/data/backup-*.db -mtime +14 -delete
```

Or push to S3 / Backblaze B2 for off-host backups.

### Scaling past a single VPS

SQLite + a single Node process handles a lot — thousands of active previews and users easily. If you outgrow a single VPS, the migration path is Postgres (swap `lib/db.ts` to use `pg`) and adding a Redis layer for rate limiting. The rest of the code stays unchanged.

## 9. Hardening checklist

Before you announce the service publicly:

- [ ] **Abuse email is monitored.** `abuse@dnspreviewer.com` should deliver somewhere a human reads.
- [ ] **Blocked hosts list populated.** Add known phishing targets to `BLOCKED_HOSTS` (major banks, webmail providers, payment processors). Sessions targeting those domains are rejected at creation.
- [ ] **Captcha in front of session creation.** Optional but recommended once abuse is seen. Cloudflare Turnstile is free and drops in as a form widget.
- [ ] **Rate-limit tuning.** Default is 10 previews/IP/hour. Drop to 3/hour if abuse starts.
- [ ] **Outbound egress restrictions.** On cloud VPS providers, make sure the server can't reach the hypervisor's metadata endpoint (`169.254.169.254`) — the SSRF guards block this but a belt-and-suspenders firewall rule is good hygiene:
  ```bash
  ufw deny out to 169.254.0.0/16
  ufw deny out to 10.0.0.0/8
  ufw deny out to 172.16.0.0/12
  ufw deny out to 192.168.0.0/16
  ufw reload
  ```
- [ ] **Uptime monitoring.** UptimeRobot free tier on `https://dnspreviewer.com` and a known preview subdomain.
- [ ] **Fail2ban on sshd.** `apt install -y fail2ban && systemctl enable --now fail2ban`.

## Troubleshooting

**Certificate issuance fails with "DNS problem."** Caddy's log will say which subdomain. Confirm the Cloudflare API token has `Zone → DNS → Edit` on `dnspreviewer.com` specifically, and that the `*` A record exists.

**Preview pages hang.** Check `journalctl -u dnspreviewer -f` for upstream timeouts. The default is 20s — large slow sites may need a bump in `lib/proxy.ts`.

**Random 502s.** Check that the target origin actually responds with the right vhost when you manually `curl -k --resolve example.com:443:TARGET_IP https://example.com/`. If that fails, the target server isn't configured to serve the domain on that IP — nothing DNS Previewer can do.
