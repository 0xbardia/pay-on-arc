import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getAuthenticatedUser } from "@/lib/auth";
import { generateApiKey, maskApiKey } from "@/lib/api-keys";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { emitWebhookEvent } from "@/lib/webhooks/deliver";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type CreateApiKeyBody = {
  name?: string;
};

function serializeApiKey(key: {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: Date | null;
  createdAt: Date;
  revokedAt: Date | null;
}) {
  return {
    id: key.id,
    name: key.name,
    prefix: maskApiKey(key.keyPrefix),
    keyPrefix: key.keyPrefix,
    lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
    createdAt: key.createdAt.toISOString(),
    revokedAt: key.revokedAt?.toISOString() ?? null,
    status: key.revokedAt ? "revoked" : "active",
  };
}

function validateName(name?: string) {
  const trimmed = name?.trim();

  if (!trimmed) {
    return { ok: false as const, error: "API key name is required." };
  }

  if (trimmed.length > 60) {
    return { ok: false as const, error: "API key name must be 60 characters or fewer." };
  }

  return { ok: true as const, name: trimmed };
}

export async function GET() {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const apiKeys = await prisma.apiKey.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    apiKeys: apiKeys.map(serializeApiKey),
  });
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "api-keys:create", 10, 60_000);

  if (limited) {
    return limited;
  }

  const auth = await getAuthenticatedUser();

  if (!auth) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as CreateApiKeyBody | null;
  const validatedName = validateName(body?.name);

  if (!validatedName.ok) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: validatedName.error }, { status: 400 });
  }

  const generated = generateApiKey();

  try {
    const apiKey = await prisma.apiKey.create({
      data: {
        userId: auth.user.id,
        name: validatedName.name,
        keyPrefix: generated.keyPrefix,
        keyHash: generated.keyHash,
      },
    });

    await writeAuditLog({
      walletAddress: auth.wallet.address,
      action: "api_key_created",
      entityType: "ApiKey",
      entityId: apiKey.id,
      metadata: {
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
      },
    });

    void emitWebhookEvent({
      userId: auth.user.id,
      type: "apikey.created",
      data: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        createdAt: apiKey.createdAt.toISOString(),
      },
    }).catch((error) => {
      if (process.env.NODE_ENV !== "production") {
        console.error("[webhooks] apikey.created emit failed", error);
      }
    });

    return NextResponse.json(
      {
        apiKey: serializeApiKey(apiKey),
        rawKey: generated.rawKey,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        {
          error: "DUPLICATE_API_KEY_NAME",
          message: "An API key with this name already exists.",
        },
        { status: 409 },
      );
    }

    throw error;
  }
}
