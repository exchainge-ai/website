import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { isRedisConfigured, cacheSet, cacheGet } from "@/lib/db/redis";
import { runStartupChecks } from "@/lib/server/startup";
import { logger } from "@/lib/server/logger";

export const dynamic = "force-dynamic";

let hasRunStartup = false;

export async function GET() {
  // Run startup checks on first health check
  if (!hasRunStartup) {
    logger.info("Running startup checks on first health check");
    await runStartupChecks();
    hasRunStartup = true;
  }
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      database: { status: "unknown", message: "" },
      redis: { status: "unknown", message: "" },
    },
  };

  // Test database connection
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("users")
      .select("id")
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows, which is fine for health check
      throw error;
    }

    health.services.database.status = "healthy";
    health.services.database.message = "Connected to Supabase";
  } catch (error) {
    health.status = "degraded";
    health.services.database.status = "unhealthy";
    health.services.database.message =
      error instanceof Error ? error.message : "Database connection failed";
  }

  // Test Redis connection
  if (!isRedisConfigured()) {
    health.services.redis.status = "not_configured";
    health.services.redis.message =
      "Redis not configured. Set UPSTASH_REDIS_REST_URL/TOKEN or REDIS_URL";
  } else {
    try {
      const testKey = "health:check";
      const testValue = { timestamp: Date.now() };

      // Try to set and get a value
      const setResult = await cacheSet(testKey, testValue, 10);
      if (!setResult) {
        throw new Error("Failed to set cache value");
      }

      const getValue = await cacheGet<typeof testValue>(testKey);
      if (!getValue || getValue.timestamp !== testValue.timestamp) {
        throw new Error("Cache value mismatch");
      }

      health.services.redis.status = "healthy";
      health.services.redis.message = "Redis cache operational";
    } catch (error) {
      health.status = "degraded";
      health.services.redis.status = "unhealthy";
      health.services.redis.message =
        error instanceof Error ? error.message : "Redis connection failed";
    }
  }

  const statusCode =
    health.status === "ok"
      ? 200
      : health.status === "degraded"
        ? 503
        : 500;

  return NextResponse.json(health, { status: statusCode });
}
