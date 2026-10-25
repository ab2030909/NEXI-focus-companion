import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get("devrelos_session")?.value;
  const { pathname } = request.nextUrl;

  const isProtectedRoute =
    pathname.startsWith("/app") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/onboarding");

  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password";

  // If trying to access protected route without session token, redirect to login
  if (isProtectedRoute && !sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If already authenticated and visiting auth route, redirect to app
  if (isAuthRoute && sessionToken) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/app/:path*",
    "/settings/:path*",
    "/onboarding",
    "/login",
    "/signup",
    "/forgot-password",
  ],
};
