import { ROOT_DOMAIN } from "./env";

const SHELL_CSS = `
  :root { color-scheme: light; }
  *{box-sizing:border-box}
  body{margin:0;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;color:#1a1a1a;background:#fff8f2;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
  .card{background:#fff;border:1px solid #ffe4cc;border-radius:20px;padding:40px;max-width:480px;width:100%;box-shadow:0 12px 40px rgba(255,114,0,.08)}
  h1{margin:0 0 8px;font-size:24px;letter-spacing:-0.02em}
  p{color:#525252;line-height:1.6;margin:0 0 16px}
  code{background:#fff1e6;color:#b84a00;padding:2px 8px;border-radius:5px;font-size:13px;font-family:ui-monospace,SFMono-Regular,monospace}
  .btn{display:inline-block;background:#ff7200;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:600;border:0;cursor:pointer;font-size:15px}
  .btn:hover{background:#e65e00}
  .brand{display:flex;align-items:center;gap:10px;margin-bottom:20px;font-weight:700;font-size:16px}
  .brand .logo{width:32px;height:32px;background:#ff7200;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;color:#fff}
  input[type=password]{width:100%;padding:12px 14px;border:1px solid #e5e7eb;border-radius:10px;font-size:15px;font-family:inherit;margin-bottom:14px}
  input[type=password]:focus{outline:none;border-color:#ff7200;box-shadow:0 0 0 3px rgba(255,114,0,.15)}
  .err{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:10px 12px;border-radius:8px;margin-bottom:14px;font-size:14px}
`;

function shell(title: string, inner: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
<style>${SHELL_CSS}</style></head><body><div class="card">
<div class="brand"><span class="logo">${logoSvg()}</span><span>DNS Previewer</span></div>
${inner}
</div></body></html>`;
}

function logoSvg(): string {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 12c3-4.5 6-7 9-7s6 2.5 9 7c-3 4.5-6 7-9 7s-6-2.5-9-7z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/></svg>`;
}

export function expiredPage(id: string): string {
  return shell(
    "Preview expired",
    `<h1>This preview has expired.</h1>
     <p>Preview <code>${escapeHtml(id)}</code> is no longer active. Anonymous previews live for 15 minutes — sign up to get no-expiry links.</p>
     <a class="btn" href="https://${ROOT_DOMAIN}/create">Create a new preview</a>`,
  );
}

export function unlockPage(id: string, previewHost: string, wrongPassword: boolean): string {
  return shell(
    "Password required",
    `<h1>Password required</h1>
     <p>This preview is protected. Enter the password to continue.</p>
     ${wrongPassword ? `<div class="err">Incorrect password. Try again.</div>` : ""}
     <form method="POST" action="https://${escapeHtml(previewHost)}/__unlock">
       <input type="password" name="password" placeholder="Preview password" autofocus required>
       <button class="btn" type="submit">Unlock preview</button>
     </form>
     <p style="margin-top:18px;font-size:13px;color:#737373">Preview ID: <code>${escapeHtml(id)}</code></p>`,
  );
}

export function upstreamErrorPage(target: string, message: string): string {
  return shell(
    "Upstream error",
    `<h1>Couldn't reach the server</h1>
     <p>DNS Previewer tried to reach <code>${escapeHtml(target)}</code> but got no usable response.</p>
     <p style="color:#737373;font-size:13px">${escapeHtml(message)}</p>
     <a class="btn" href="https://${ROOT_DOMAIN}/">Back to DNS Previewer</a>`,
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}
