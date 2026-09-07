import { TURNSTILE_ENABLED, TURNSTILE_SECRET_KEY } from "./env";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileResult {
  ok: boolean;
  reason?: string;
}

/**
 * Verify a Turnstile token server-side. Returns ok when the captcha is not
 * configured, so local dev and self-hosted installs work unconfigured.
 */
export async function verifyTurnstile(
  token: string | null | undefined,
  ip: string,
): Promise<TurnstileResult> {
  if (!TURNSTILE_ENABLED) return { ok: true };
  if (!token) return { ok: false, reason: "missing" };

  const form = new URLSearchParams();
  form.set("secret", TURNSTILE_SECRET_KEY);
  form.set("response", token);
  if (ip && ip !== "unknown") form.set("remoteip", ip);

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (data.success) return { ok: true };
    return { ok: false, reason: (data["error-codes"] || []).join(",") || "rejected" };
  } catch (e) {
    // Cloudflare unreachable. Fail open rather than taking the product down
    // with it — the rate limiter and blocklist still apply.
    console.error("[turnstile] verify failed:", (e as Error).message);
    return { ok: true };
  }
}
