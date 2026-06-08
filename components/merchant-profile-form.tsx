"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { useToast } from "@/components/premium/toast";
import { Button } from "@/components/ui/button";
import type { MerchantProfile } from "@/lib/merchant-profile";

type MerchantProfileFormProps = {
  initialProfile: MerchantProfile;
};

type FieldErrors = Partial<Record<keyof MerchantProfile, string>>;

const fields: Array<{
  name: keyof MerchantProfile;
  label: string;
  placeholder: string;
  type?: string;
  helper?: string;
}> = [
  {
    name: "merchantName",
    label: "Merchant Name",
    placeholder: "Ben’s Store",
    helper: "Shown on checkout pages and your merchant profile.",
  },
  {
    name: "merchantSlug",
    label: "Merchant Slug",
    placeholder: "ben-store",
    helper: "Lowercase letters, numbers, and hyphens only.",
  },
  {
    name: "merchantEmail",
    label: "Merchant Email",
    placeholder: "merchant@example.com",
    type: "email",
  },
  {
    name: "supportEmail",
    label: "Support Email",
    placeholder: "support@example.com",
    type: "email",
  },
  {
    name: "websiteUrl",
    label: "Website URL",
    placeholder: "https://example.com",
    type: "url",
  },
  {
    name: "logoUrl",
    label: "Logo URL",
    placeholder: "https://example.com/logo.png",
    type: "url",
  },
];

function toFormState(profile: MerchantProfile) {
  return {
    merchantName: profile.merchantName ?? "",
    merchantSlug: profile.merchantSlug ?? "",
    merchantEmail: profile.merchantEmail ?? "",
    supportEmail: profile.supportEmail ?? "",
    websiteUrl: profile.websiteUrl ?? "",
    logoUrl: profile.logoUrl ?? "",
  };
}

export function MerchantProfileForm({ initialProfile }: MerchantProfileFormProps) {
  const router = useRouter();
  const { notify } = useToast();
  const [form, setForm] = useState(toFormState(initialProfile));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrors({});

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json().catch(() => null)) as {
        profile?: MerchantProfile;
        message?: string;
        error?: string;
        fields?: FieldErrors;
      } | null;

      if (!response.ok) {
        setErrors(payload?.fields ?? {});
        notify({
          type: "error",
          title: "Profile update failed",
          description: payload?.message ?? payload?.error ?? "Check the profile fields and try again.",
        });
        return;
      }

      if (payload?.profile) {
        setForm(toFormState(payload.profile));
      }

      notify({
        type: "success",
        title: "Merchant profile saved",
        description: "Checkout branding has been updated.",
      });

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("[profile] save failed", error);
      notify({
        type: "error",
        title: "Network failed",
        description: "Unable to save the merchant profile. Try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const disabled = isSaving || isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        {fields.map((field) => (
          <label key={field.name} className="block">
            <span className="text-sm font-medium text-slate-300">{field.label}</span>
            <input
              aria-invalid={Boolean(errors[field.name])}
              aria-describedby={`${field.name}-hint`}
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20"
              disabled={disabled}
              name={field.name}
              onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
              placeholder={field.placeholder}
              type={field.type ?? "text"}
              value={form[field.name]}
            />
            <span id={`${field.name}-hint`} className="mt-1 block text-xs text-slate-500">
              {errors[field.name] ?? field.helper ?? "Optional"}
            </span>
          </label>
        ))}
      </div>
      <div className="flex flex-col gap-3 border-t border-white/5 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-slate-400">
          Saved branding appears on checkout pages, the sidebar, dashboard, and public merchant profile.
        </p>
        <Button disabled={disabled} type="submit">
          <Save className="h-4 w-4" aria-hidden="true" />
          {isSaving ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </form>
  );
}
