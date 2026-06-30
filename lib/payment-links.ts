import { randomBytes } from "crypto";

export function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
}

export function getRequestOrigin(headers: Pick<Headers, "get">) {
  const configuredAppUrl = getAppUrl();

  if (configuredAppUrl) {
    return configuredAppUrl;
  }

  const forwardedProto = headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = headers.get("host")?.split(",")[0]?.trim();
  const requestHost = forwardedHost || host;

  if (!requestHost) {
    return "";
  }

  return `${forwardedProto || "http"}://${requestHost}`.replace(/\/$/, "");
}

export function getPaymentUrl(slug: string, origin?: string) {
  const appUrl = getAppUrl() || origin?.replace(/\/$/, "") || "";

  return `${appUrl}/pay/${slug}`;
}

export function createPaymentSlug(title: string) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `${base || "payment"}-${randomBytes(4).toString("hex")}`;
}

export function isPaymentLinkExpired(expiresAt?: Date | string | null) {
  if (!expiresAt) {
    return false;
  }

  return new Date(expiresAt).getTime() <= Date.now();
}
