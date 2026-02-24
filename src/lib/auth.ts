import { createHmac } from "crypto";

const SIGNING_KEY = process.env.SITE_PASSWORD || "OryxRulezzz2026!";

export const COOKIE_NAME = "pgbl_auth";
export const MAX_AGE = 60 * 60 * 24 * 7; // 7 days
export const MAX_AGE_MS = MAX_AGE * 1000;

function signToken(payload: string): string {
  const hmac = createHmac("sha256", SIGNING_KEY);
  hmac.update(payload);
  return hmac.digest("hex");
}

export function createAuthCookie(): string {
  const payload = `authenticated:${Date.now()}`;
  const signature = signToken(payload);
  return `${payload}.${signature}`;
}

export function verifyAuthCookie(cookieValue: string): boolean {
  const parts = cookieValue.split(".");
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;

  // Verify HMAC signature (constant-time comparison)
  const expected = signToken(payload);
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  if (mismatch !== 0) return false;

  // Verify timestamp is not expired
  const tsMatch = payload.match(/:(\d+)$/);
  if (!tsMatch) return false;
  const timestamp = Number(tsMatch[1]);
  if (Date.now() - timestamp > MAX_AGE_MS) return false;

  return true;
}
