import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // 1. Belum login & mencoba akses area terproteksi
  if (
    !token &&
    (pathname.startsWith("/internal") || pathname.startsWith("/portal"))
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token) {
    const decoded = parseJwt(token);

    if (!decoded || !decoded.role) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("token");
      return response;
    }

    const userRole = decoded.role;

    // 2. Klien mencoba akses area internal -> Lempar ke portal
    if (userRole === "CLIENT" && pathname.startsWith("/internal")) {
      return NextResponse.redirect(new URL("/portal", request.url));
    }

    // 3. Tim Internal (OWNER, ADMIN, STAFF) mencoba akses portal klien -> Lempar ke internal
    if (userRole !== "CLIENT" && pathname.startsWith("/portal")) {
      return NextResponse.redirect(new URL("/internal", request.url));
    }

    // 4. Buka halaman login / root saat sudah login
    if (pathname === "/login" || pathname === "/") {
      if (userRole === "CLIENT") {
        return NextResponse.redirect(new URL("/portal", request.url));
      } else {
        return NextResponse.redirect(new URL("/internal", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  // Gunakan pola ini agar Middleware berjalan di semua route kecuali file statis & API
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
