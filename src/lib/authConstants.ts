// Shared auth constants — imported by both auth.ts (Node) and middleware.ts (Edge).
// Keep this file free of Node-specific imports (crypto, fs, etc.).

export const COOKIE_NAME = "pgbl_auth";
export const MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds
export const MAX_AGE_MS = MAX_AGE * 1000;

export const SIGNING_KEY = process.env.COOKIE_SECRET
  || `cookie-sign:${process.env.SITE_PASSWORD || "OryxRulezzz2026!"}`;
