import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { COOKIE_NAME, MAX_AGE, createAuthCookie } from "@/lib/auth";

const SITE_PASSWORD = process.env.SITE_PASSWORD || "OryxRulezzz2026!";

function constantTimeEqual(a: string, b: string): boolean {
  const ha = createHmac("sha256", "cmp").update(a).digest();
  const hb = createHmac("sha256", "cmp").update(b).digest();
  if (ha.length !== hb.length) return false;
  let mismatch = 0;
  for (let i = 0; i < ha.length; i++) {
    mismatch |= ha[i] ^ hb[i];
  }
  return mismatch === 0;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    if (typeof password === "string" && constantTimeEqual(password, SITE_PASSWORD)) {
      const response = NextResponse.json({ success: true });
      response.cookies.set(COOKIE_NAME, createAuthCookie(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: MAX_AGE,
        path: "/",
      });
      return response;
    }

    return NextResponse.json(
      { success: false, error: "Senha incorreta" },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Requisicao invalida" },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
