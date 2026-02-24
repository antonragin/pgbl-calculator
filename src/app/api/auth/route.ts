import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, MAX_AGE, createAuthCookie } from "@/lib/auth";

const SITE_PASSWORD = process.env.SITE_PASSWORD || "OryxRulezzz2026!";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    if (password === SITE_PASSWORD) {
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
