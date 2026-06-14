import "server-only";

import { z } from "zod";

const requiredProductionVars = ["DATABASE_URL", "SESSION_SECRET", "NEXT_PUBLIC_APP_URL"] as const;

type EnvKey = (typeof requiredProductionVars)[number];

type EnvValidationResult = {
  ok: boolean;
  missing: EnvKey[];
};

const productionEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

function validateProductionEnv(): EnvValidationResult {
  const parsed = productionEnvSchema.safeParse(process.env);

  if (parsed.success) {
    return { ok: true, missing: [] };
  }

  const missing = parsed.error.issues
    .map((issue) => issue.path[0])
    .filter((key): key is EnvKey => requiredProductionVars.includes(key as EnvKey));

  return { ok: false, missing };
}

export const appVersion = process.env.APP_VERSION?.trim() || "1.0.0";

export function getEnvValidation() {
  if (process.env.NODE_ENV !== "production") {
    return { ok: true, missing: [] as EnvKey[] };
  }

  return validateProductionEnv();
}

export function assertProductionEnv() {
  const validation = getEnvValidation();

  if (!validation.ok) {
    throw new Error(`Missing required production environment variables: ${validation.missing.join(", ")}`);
  }
}
