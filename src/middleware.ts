import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "pgbl_auth";
const SIGNING_KEY = process.env.SITE_PASSWORD || "OryxRulezzz2026!";
const MAX_AGE_MS = 60 * 60 * 24 * 7 * 1000; // 7 days in ms

const PUBLIC_PATHS = ["/login", "/api/auth"];

async function verifyCookie(cookieValue: string): Promise<boolean> {
  const parts = cookieValue.split(".");
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;

  // Verify HMAC signature using Web Crypto API (Edge Runtime compatible)
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SIGNING_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison
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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/api/tax-rules"
  ) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(COOKIE_NAME);
  if (cookie?.value && (await verifyCookie(cookie.value))) {
    return NextResponse.next();
  }

  // Redirect to login
  const loginUrl = new URL("/login", req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
