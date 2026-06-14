import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { emitWebhookEvent } from "@/lib/webhooks/deliver";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.apiKey.findFirst({
    where: {
      id,
      userId: auth.user.id,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "API key not found." }, { status: 404 });
  }

  if (existing.revokedAt) {
    return NextResponse.json({
      apiKey: {
        id: existing.id,
        revokedAt: existing.revokedAt.toISOString(),
        status: "revoked",
      },
    });
  }

  const revokedAt = new Date();
  const apiKey = await prisma.apiKey.update({
    where: { id },
    data: { revokedAt },
  });

  await writeAuditLog({
    walletAddress: auth.wallet.address,
    action: "api_key_revoked",
    entityType: "ApiKey",
    entityId: apiKey.id,
    metadata: {
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
    },
  });

  void emitWebhookEvent({
    userId: auth.user.id,
    type: "apikey.revoked",
    data: {
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      revokedAt: apiKey.revokedAt?.toISOString() ?? revokedAt.toISOString(),
    },
  }).catch((error) => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[webhooks] apikey.revoked emit failed", error);
    }
  });

  return NextResponse.json({
    apiKey: {
      id: apiKey.id,
      revokedAt: apiKey.revokedAt?.toISOString() ?? revokedAt.toISOString(),
      status: "revoked",
    },
  });
}
