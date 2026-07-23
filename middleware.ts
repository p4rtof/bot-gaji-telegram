import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const uid = req.cookies.get("uid")?.value;
  const role = req.cookies.get("role")?.value;

  // Belum login, mau akses halaman protected -> lempar ke /login
  if (!uid && (pathname.startsWith("/admin") || pathname.startsWith("/pengajuan"))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Sudah login tapi bukan admin, coba akses /admin -> tolak
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/pengajuan", req.url));
  }

  // Sudah login, buka /login lagi -> lempar ke halaman masing-masing
  if (uid && pathname === "/login") {
    return NextResponse.redirect(
      new URL(role === "admin" ? "/admin" : "/pengajuan", req.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/pengajuan/:path*", "/login"],
};