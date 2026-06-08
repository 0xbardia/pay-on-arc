export type MerchantProfile = {
  merchantName: string | null;
  merchantSlug: string | null;
  merchantEmail: string | null;
  supportEmail: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
};

export type MerchantProfileInput = Partial<Record<keyof MerchantProfile, unknown>>;

export type MerchantProfileValidationResult =
  | { ok: true; data: MerchantProfile }
  | { ok: false; errors: Partial<Record<keyof MerchantProfile, string>> };

const slugPattern = /^[a-z0-9-]+$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function optionalString(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeUrl(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
}

export function validateMerchantProfile(input: MerchantProfileInput): MerchantProfileValidationResult {
  const errors: Partial<Record<keyof MerchantProfile, string>> = {};
  const merchantName = optionalString(input.merchantName);
  const merchantSlug = optionalString(input.merchantSlug);
  const merchantEmail = optionalString(input.merchantEmail);
  const supportEmail = optionalString(input.supportEmail);
  const websiteUrl = normalizeUrl(optionalString(input.websiteUrl));
  const logoUrl = normalizeUrl(optionalString(input.logoUrl));

  if (merchantName === "") {
    errors.merchantName = "Merchant name must be text.";
  } else if (merchantName && merchantName.length > 80) {
    errors.merchantName = "Merchant name must be 80 characters or fewer.";
  }

  if (merchantSlug === "") {
    errors.merchantSlug = "Merchant slug must be text.";
  } else if (merchantSlug && !slugPattern.test(merchantSlug)) {
    errors.merchantSlug = "Use lowercase letters, numbers, and hyphens only.";
  }

  if (merchantEmail === "") {
    errors.merchantEmail = "Merchant email must be text.";
  } else if (merchantEmail && !emailPattern.test(merchantEmail)) {
    errors.merchantEmail = "Enter a valid merchant email.";
  }

  if (supportEmail === "") {
    errors.supportEmail = "Support email must be text.";
  } else if (supportEmail && !emailPattern.test(supportEmail)) {
    errors.supportEmail = "Enter a valid support email.";
  }

  if (websiteUrl === "") {
    errors.websiteUrl = "Enter a valid http or https URL.";
  }

  if (logoUrl === "") {
    errors.logoUrl = "Enter a valid http or https logo URL.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      merchantName,
      merchantSlug,
      merchantEmail,
      supportEmail,
      websiteUrl,
      logoUrl,
    },
  };
}

export function serializeMerchantProfile(profile: MerchantProfile): MerchantProfile {
  return {
    merchantName: profile.merchantName ?? null,
    merchantSlug: profile.merchantSlug ?? null,
    merchantEmail: profile.merchantEmail ?? null,
    supportEmail: profile.supportEmail ?? null,
    websiteUrl: profile.websiteUrl ?? null,
    logoUrl: profile.logoUrl ?? null,
  };
}

export function getMerchantDisplayName(profile: Pick<MerchantProfile, "merchantName"> | null | undefined) {
  return profile?.merchantName?.trim() || "Pay On Arc merchant";
}
