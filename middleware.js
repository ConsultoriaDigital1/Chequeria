import { NextResponse } from "next/server";
import { getAuthCookieName, verifySessionToken } from "@/lib/auth";

function isPublicPath(pathname) {
  return pathname === "/login" || pathname === "/favicon.ico";
}

function isPublicApiPath(pathname) {
  return pathname === "/api/auth/login" || pathname === "/api/auth/logout";
}

const rateLimitStore = new Map();

function checkRateLimit(key, limit, windowMs) {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

function getClientIp(request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

export async function middleware(request) {
  const { pathname, search } = request.nextUrl;

  if (isPublicPath(pathname) || isPublicApiPath(pathname)) {
    if (pathname === "/login") {
      const token = request.cookies.get(getAuthCookieName())?.value;
      const session = await verifySessionToken(token);
      if (session) return NextResponse.redirect(new URL("/", request.url));
    }

    if (pathname === "/api/auth/login") {
      const ip = getClientIp(request);
      if (!checkRateLimit(`login:${ip}`, 10, 60_000)) {
        return NextResponse.json({ error: "Demasiados intentos. Esperá un momento." }, { status: 429 });
      }
    }

    return NextResponse.next();
  }

  const token = request.cookies.get(getAuthCookieName())?.value;
  const session = await verifySessionToken(token);

  if (session) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"]
};
