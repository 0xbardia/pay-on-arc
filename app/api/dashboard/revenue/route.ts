import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getRevenueSeries, parseAnalyticsPeriod } from "@/lib/dashboard-analytics";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const period = parseAnalyticsPeriod(new URL(request.url).searchParams.get("period"));

  return NextResponse.json({
    period,
    series: await getRevenueSeries(auth.user.id, period),
  });
}
