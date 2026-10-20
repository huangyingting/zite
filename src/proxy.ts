import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PROTECTED_PREFIXES = [
  "/home",
  "/workspace/",
  "/database/",
  "/editor/",
  "/migrate",
  "/billing/",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret:
      process.env.NEXTAUTH_SECRET ??
      "zite-super-secret-jwt-signing-key-for-local-dev-2026",
  });

  if (!token || !token.sub) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectPath", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (
    (token as { revoked?: boolean }).revoked ||
    token.status === "REVOKED" ||
    token.status === "DISABLED"
  ) {
    return NextResponse.redirect(new URL("/disabled", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home/:path*",
    "/workspace/:path*",
    "/database/:path*",
    "/editor/:path*",
    "/migrate/:path*",
    "/billing/:path*",
  ],
};
