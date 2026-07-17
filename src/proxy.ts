import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/admin-session";

const PUBLIC_ROUTES = new Set([
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
]);
const ADMIN_LOGIN_ROUTE = "/admin/login";

// Optimistic checks only (JWT/cookie-signature only, no DB hit) — real
// authorization happens in src/lib/tenant-db.ts and src/lib/admin-auth.ts
// on every server action / query. /admin/** is a completely separate
// audience from the tenant app, so it's checked against its own signed
// cookie instead of the tenant NextAuth session.
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const isLoggedIn = !!verifyAdminToken(req.cookies.get(ADMIN_COOKIE_NAME)?.value);

    if (!isLoggedIn && pathname !== ADMIN_LOGIN_ROUTE) {
      return NextResponse.redirect(new URL(ADMIN_LOGIN_ROUTE, req.nextUrl));
    }
    if (isLoggedIn && pathname === ADMIN_LOGIN_ROUTE) {
      return NextResponse.redirect(new URL("/admin", req.nextUrl));
    }
    return NextResponse.next();
  }

  const session = await auth();
  const isLoggedIn = !!session;
  const isPublicRoute = PUBLIC_ROUTES.has(pathname);

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Deliberately no "already logged in -> bounce to /dashboard" redirect
  // here: /login must always show the login form when visited directly
  // (e.g. the landing page's "Get Started" button), never silently skip
  // past it because of an existing session.
  return NextResponse.next();
}

export const config = {
  // Also excludes static assets served straight out of public/ (logos,
  // icons, etc.) — without this, a logged-out request for e.g. /logo.png
  // gets redirected to /login and the browser receives that page's HTML
  // instead of the image.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
