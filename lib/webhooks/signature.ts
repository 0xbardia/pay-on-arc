import "server-only";

import { createHmac, createHash, randomBytes, timingSafeEqual } from "crypto";

const secretPrefix = "arcsec_";
const secretAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

function randomSecret(length = 36) {
  const bytes = randomBytes(length);
  let secret = "";

  for (const byte of bytes) {
    secret += secretAlphabet[byte % secretAlphabet.length];
  }

  return secret;
}

export function generateWebhookSecret() {
  const secret = `${secretPrefix}${randomSecret()}`;

  return {
    secret,
    secretPrefix: secret.slice(0, secretPrefix.length + 5),
    secretHash: hashWebhookSecret(secret),
  };
}

export function hashWebhookSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

export function maskWebhookSecret(prefix: string) {
  return `${prefix}********`;
}

export function signArcPayWebhook({
  secretHash,
  timestamp,
  rawBody,
}: {
  secretHash: string;
  timestamp: string | number;
  rawBody: string;
}) {
  return createHmac("sha256", secretHash).update(`${timestamp}.${rawBody}`).digest("hex");
}

export function verifyArcPaySignature({
  secret,
  timestamp,
  rawBody,
  signature,
  toleranceSeconds = 300,
}: {
  secret: string;
  timestamp: string | number;
  rawBody: string;
  signature: string;
  toleranceSeconds?: number;
}) {
  const timestampNumber = Number(timestamp);

  if (!Number.isFinite(timestampNumber)) {
    return false;
  }

  const ageMs = Math.abs(Date.now() - timestampNumber * 1000);

  if (ageMs > toleranceSeconds * 1000) {
    return false;
  }

  const expected = signArcPayWebhook({ secretHash: hashWebhookSecret(secret), timestamp, rawBody });
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  return expectedBuffer.length === signatureBuffer.length && timingSafeEqual(expectedBuffer, signatureBuffer);
}
