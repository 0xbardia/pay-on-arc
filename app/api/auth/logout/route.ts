import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import {
  clearWalletCookieOptions,
  getCurrentWalletSession,
  walletNonceCookieName,
  walletSessionCookieName,
} from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getCurrentWalletSession();
  const response = NextResponse.json({ ok: true });
  const cookieOptions = clearWalletCookieOptions(request);

  if (session) {
    await writeAuditLog({
      walletAddress: session.address,
      action: "AUTH_LOGOUT",
      entityType: "User",
      entityId: session.userId,
    });
  }

  response.cookies.set(walletSessionCookieName, "", cookieOptions);
  response.cookies.set(walletNonceCookieName, "", cookieOptions);

  return response;
}
