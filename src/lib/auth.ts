import { createHmac } from "crypto";
import { SIGNING_KEY, MAX_AGE, MAX_AGE_MS, COOKIE_NAME } from "./authConstants";

// Re-export for convenience
export { COOKIE_NAME, MAX_AGE, MAX_AGE_MS };

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
