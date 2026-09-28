import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const isInternalRoute = pathname.startsWith("/internal");
  const isPortalRoute = pathname.startsWith("/portal");
  const isProtectedRoute = isInternalRoute || isPortalRoute;

  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL("/internal", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/internal/:path*", "/portal/:path*", "/login"],
};
