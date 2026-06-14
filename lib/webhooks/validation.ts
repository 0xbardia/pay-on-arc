import "server-only";

import { isIP } from "net";

const privateIpv4Patterns = [
  /^127\./,
  /^0\./,
  /^10\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
];

export type WebhookValidationResult =
  | { ok: true; url: string }
  | { ok: false; message: string };

export function validateWebhookUrl(input: unknown): WebhookValidationResult {
  if (typeof input !== "string") {
    return { ok: false, message: "Webhook URL is required." };
  }

  const rawUrl = input.trim();

  if (!rawUrl) {
    return { ok: false, message: "Webhook URL is required." };
  }

  if (rawUrl.length > 2048) {
    return { ok: false, message: "Webhook URL must be 2048 characters or fewer." };
  }

  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, message: "Webhook URL must be valid." };
  }

  const isDevelopment = process.env.NODE_ENV !== "production";
  const hostname = url.hostname.toLowerCase();
  const isLocalhost = hostname === "localhost";

  if (url.protocol !== "https:" && !(isDevelopment && isLocalhost && url.protocol === "http:")) {
    return { ok: false, message: "Webhook URL must use https://." };
  }

  if (isLocalhost) {
    return isDevelopment
      ? { ok: true, url: url.toString() }
      : { ok: false, message: "Localhost webhook URLs are not allowed in production." };
  }

  if (hostname === "0.0.0.0" || hostname === "127.0.0.1") {
    return { ok: false, message: "Loopback webhook URLs are not allowed." };
  }

  const ipVersion = isIP(hostname);

  if (ipVersion === 4 && privateIpv4Patterns.some((pattern) => pattern.test(hostname))) {
    return { ok: false, message: "Private network webhook URLs are not allowed." };
  }

  if (ipVersion === 6 && (hostname === "::1" || hostname.startsWith("fe80:") || hostname.startsWith("fc") || hostname.startsWith("fd"))) {
    return { ok: false, message: "Private network webhook URLs are not allowed." };
  }

  return { ok: true, url: url.toString() };
}

export function validateWebhookName(input: unknown) {
  if (typeof input !== "string" || !input.trim()) {
    return { ok: false as const, message: "Webhook name is required." };
  }

  const name = input.trim();

  if (name.length > 80) {
    return { ok: false as const, message: "Webhook name must be 80 characters or fewer." };
  }

  return { ok: true as const, name };
}
