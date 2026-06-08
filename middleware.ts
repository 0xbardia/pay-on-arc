import { NextResponse, type NextRequest } from "next/server";

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  );
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      "frame-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  );

  return response;
}

function getAdminPanelPath() {
  const configuredPath = process.env.ADMIN_PANEL_PATH?.trim() || "/secure-admin";
  const normalizedPath = configuredPath.startsWith("/") ? configuredPath : `/${configuredPath}`;

  return normalizedPath.replace(/\/+$/, "") || "/secure-admin";
}

export function middleware(request: NextRequest) {
  const adminPath = getAdminPanelPath();
  const { pathname } = request.nextUrl;

  if (pathname === "/app" || pathname.startsWith("/app/")) {
    if (!request.cookies.get("arcpay_session")?.value) {
      return applySecurityHeaders(NextResponse.redirect(new URL("/", request.url)));
    }
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return applySecurityHeaders(NextResponse.redirect(new URL("/", request.url)));
  }

  if (pathname === adminPath || pathname.startsWith(`${adminPath}/`)) {
    const rewrittenUrl = request.nextUrl.clone();
    rewrittenUrl.pathname = pathname.replace(adminPath, "/admin") || "/admin";

    return applySecurityHeaders(NextResponse.rewrite(rewrittenUrl));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
