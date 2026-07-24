import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const uid = req.cookies.get("uid")?.value;
  const role = req.cookies.get("role")?.value;

  const protectedPaths = ["/admin", "/koordinator", "/pengajuan"];

  // Belum login, mau akses halaman protected -> lempar ke /login
  if (!uid && protectedPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Sudah login tapi bukan admin, coba akses /admin -> tolak
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL(homeForRole(role), req.url));
  }

  // Sudah login tapi bukan koordinator (dan bukan admin), coba akses /koordinator -> tolak
  if (
    pathname.startsWith("/koordinator") &&
    role !== "koordinator" &&
    role !== "admin"
  ) {
    return NextResponse.redirect(new URL(homeForRole(role), req.url));
  }

  // Sudah login, buka /login lagi -> lempar ke halaman masing-masing
  if (uid && pathname === "/login") {
    return NextResponse.redirect(new URL(homeForRole(role), req.url));
  }

  return NextResponse.next();
}

function homeForRole(role?: string): string {
  if (role === "admin") return "/admin";
  if (role === "koordinator") return "/koordinator";
  return "/pengajuan";
}

export const config = {
  matcher: ["/admin/:path*", "/koordinator/:path*", "/pengajuan/:path*", "/login"],
};