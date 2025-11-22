import { z } from "zod";

function trimUrl(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.replace(/\/+$/, "");
}

function deriveApiBaseUrl({
  apiBaseUrl,
  appUrl,
}: {
  apiBaseUrl?: string | null;
  appUrl?: string | null;
}): string | undefined {
  const normalizedApi = trimUrl(apiBaseUrl);
  if (normalizedApi) {
    return normalizedApi;
  }

  const normalizedApp = trimUrl(appUrl);
  if (normalizedApp) {
    return `${normalizedApp}/api`;
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin.replace(/\/+$/, "")}/api`;
  }

  return undefined;
}

const publicEnvSchema = z.object({
  appUrl: z
    .string()
    .url({ message: "NEXT_PUBLIC_APP_URL must be a valid URL" }),
  apiBaseUrl: z
    .string()
    .url({ message: "NEXT_PUBLIC_API_BASE_URL must be a valid URL" }),
  privyAppId: z.string().min(1, {
    message: "NEXT_PUBLIC_PRIVY_APP_ID is required",
  }),
  privyClientId: z.string().min(1, {
    message: "NEXT_PUBLIC_PRIVY_CLIENT_ID is required",
  }),
  solanaRpcUrl: z
    .string()
    .url({ message: "NEXT_PUBLIC_SOLANA_RPC_URL must be a valid URL" })
    .optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ValidatedEnv = PublicEnv;

export function resolveApiBaseUrl(): string | undefined {
  return deriveApiBaseUrl({
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
  });
}

export function validatePublicEnv(): PublicEnv {
  const envValues = {
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    apiBaseUrl: resolveApiBaseUrl(),
    privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    privyClientId: process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID,
    solanaRpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
  };

  try {
    return publicEnvSchema.parse(envValues);
  } catch (error) {
    handleValidationError(error);
  }
}

export function validateEnv(): ValidatedEnv {
  return validatePublicEnv();
}

function handleValidationError(error: unknown): never {
  if (error instanceof z.ZodError) {
    const issues = error.issues
      .map((issue) => {
        const path = issue.path.join(".");
        return `  - ${path || "unknown"}: ${issue.message}`;
      })
      .join("\n");

    throw new Error(
      `Environment variable validation failed:\n${issues}\n\nEnsure your .env.local file includes all required variables.`,
    );
  }

  throw error;
}
