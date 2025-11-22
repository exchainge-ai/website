import { z } from "zod";

// Schema for public environment variables (available on client and server)
const publicEnvSchema = z.object({
  supabaseUrl: z
    .string()
    .url("Must be a valid URL for your Supabase instance")
    .min(1, {
      message: "The URL of your Supabase instance is required",
    }),
  supabaseAnonKey: z.string().min(1, {
    message: "The anonymous key for your Supabase instance is required",
  }),
  appUrl: z.string().url("Must be a valid URL for your app"),
  privyAppId: z.string().min(1, {
    message: "The Privy app ID is required",
  }),
  privyClientId: z.string().min(1, {
    message: "The Privy client ID is required",
  }),
});

// Schema for server-only environment variables (not exposed to the client)
const serverEnvSchema = z
  .object({
    supabaseServiceRoleKey: z.string().min(1, {
      message:
        "The Supabase service role key is required for server operations",
    }),
    resendConfig: z
      .object({
        apiKey: z.string().min(1, {
          message: "The Resend API key is required",
        }),
        fromEmail: z.string().min(1, {
          message: "The Resend from email is required",
        }),
      })
      .optional(),
    privyAppSecret: z.string().min(1, {
      message: "The Privy app secret is required",
    }),
    redisUrl: z
      .string()
      .url("REDIS_URL must be a valid URL")
      .optional(),
    upstashRedisRestUrl: z
      .string()
      .url("UPSTASH_REDIS_REST_URL must be a valid URL")
      .optional(),
    upstashRedisRestToken: z
      .string()
      .min(1, {
        message:
          "UPSTASH_REDIS_REST_TOKEN is required when using the Upstash REST client",
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    const redisConfigured = Boolean(data.redisUrl);
    const upstashConfigured = Boolean(
      data.upstashRedisRestUrl && data.upstashRedisRestToken,
    );
    const requireRedis = process.env.NODE_ENV === "production";

    if (requireRedis && !redisConfigured && !upstashConfigured) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Either REDIS_URL or both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in production.",
        path: ["redisUrl"],
      });
    }

    if (data.upstashRedisRestUrl && !data.upstashRedisRestToken) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "UPSTASH_REDIS_REST_TOKEN is required when UPSTASH_REDIS_REST_URL is provided.",
        path: ["upstashRedisRestToken"],
      });
    }

    if (data.upstashRedisRestToken && !data.upstashRedisRestUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "UPSTASH_REDIS_REST_URL is required when UPSTASH_REDIS_REST_TOKEN is provided.",
        path: ["upstashRedisRestUrl"],
      });
    }
  });

// Create types from the schemas
export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

// Combined type for all environment variables
export type ValidatedEnv = PublicEnv & ServerEnv;

/**
 * Validates public environment variables that are safe to use on the client
 * @returns The validated public environment variables
 */
export function validatePublicEnv(): PublicEnv {
  const env = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    privyClientId: process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID,
  };

  // Skip validation during build if vars aren't set (Railway build context)
  if (typeof window === 'undefined' && !env.supabaseUrl) {
    return env as PublicEnv;
  }

  try {
    return publicEnvSchema.parse(env);
  } catch (error) {
    handleValidationError(error);
  }
}

/**
 * Validates all environment variables (both public and server-only)
 * This should ONLY be used in server contexts
 * @returns The validated environment variables
 */
export function validateEnv(): ValidatedEnv {
  // First validate public env vars
  const publicEnv = validatePublicEnv();

  const resendConfig =
    !!process.env.RESEND_API_KEY && !!process.env.RESEND_FROM_EMAIL
      ? {
          apiKey: process.env.RESEND_API_KEY,
          fromEmail: process.env.RESEND_FROM_EMAIL,
        }
      : undefined;

  // Then validate server-only env vars
  const serverEnv = {
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    resendConfig,
    privyAppSecret: process.env.PRIVY_APP_SECRET,
    redisUrl: process.env.REDIS_URL,
    upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL,
    upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN,
  };

  // Skip validation during build if vars aren't set (Railway build context)
  if (!publicEnv.supabaseUrl) {
    return { ...publicEnv, ...serverEnv } as ValidatedEnv;
  }

  try {
    const validatedServerEnv = serverEnvSchema.parse(serverEnv);
    return { ...publicEnv, ...validatedServerEnv };
  } catch (error) {
    handleValidationError(error);
  }
}

/**
 * Helper function to handle validation errors
 */
function handleValidationError(error: unknown): never {
  if (error instanceof z.ZodError) {
    const missingVars = error.issues
      .map((err) => {
        const path = err.path.join(".");
        return `  - ${path}: ${err.message}`;
      })
      .join("\n");

    throw new Error(
      `Environment variable validation failed:\n${missingVars}\n\nPlease check your .env.local file and make sure all required variables are set correctly.`,
    );
  }

  // Re-throw other errors
  throw error;
}
