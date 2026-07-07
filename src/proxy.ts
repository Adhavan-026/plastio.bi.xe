import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PUBLIC_ROUTES = new Set(["/", "/login", "/signup"]);

// Optimistic check only (reads the JWT, no DB hit) — real authorization
// happens in src/lib/tenant-db.ts on every server action / query.
export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isPublicRoute = PUBLIC_ROUTES.has(req.nextUrl.pathname);

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isLoggedIn && (req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
