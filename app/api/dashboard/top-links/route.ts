import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getTopPaymentLinks } from "@/lib/dashboard-analytics";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  return NextResponse.json({
    topLinks: await getTopPaymentLinks(auth.user.id),
  });
}
