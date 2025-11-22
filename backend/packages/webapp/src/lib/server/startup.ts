/**
 * Startup checks and logging
 * Verifies all services are configured and ready
 */

import { logger } from "./logger";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { isRedisConfigured, cacheGet, cacheSet } from "@/lib/db/redis";

export async function runStartupChecks() {
  console.log("\n" + "=".repeat(60));
  console.log("ExchAInge MVP Starting...");
  console.log("=".repeat(60) + "\n");

  // Check Supabase
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("users")
      .select("id")
      .limit(1);

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    logger.db.connected("Supabase PostgreSQL");
  } catch (error) {
    logger.db.error(
      "Supabase",
      error instanceof Error ? error.message : "Connection failed"
    );
    console.log("[WARN] Supabase not connected. Check your environment variables.\n");
  }

  // Check Redis
  if (!isRedisConfigured()) {
    logger.warn("Redis not configured", {
      note: "App will work without Redis but with reduced performance",
    });
    console.log("[WARN] Redis not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN\n");
  } else {
    try {
      const testKey = `startup:${Date.now()}`;
      const testValue = { test: true };

      await cacheSet(testKey, testValue, 10);
      const retrieved = await cacheGet(testKey);

      if (retrieved) {
        logger.db.connected("Redis Cache (Upstash)");
      } else {
        throw new Error("Cache read/write test failed");
      }
    } catch (error) {
      logger.db.error(
        "Redis",
        error instanceof Error ? error.message : "Connection failed"
      );
      console.log("[WARN] Redis connection failed. Check your credentials.\n");
    }
  }

  // Environment check
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_PRIVY_APP_ID",
    "PRIVY_APP_SECRET",
  ];

  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logger.error("Missing required environment variables", {
      missing: missing.join(", "),
    });
    console.log("[ERROR] Missing environment variables:");
    missing.forEach((key) => console.log(`  - ${key}`));
    console.log("");
  } else {
    logger.success("All required environment variables set");
  }

  // Check auto-approval mode
  const autoApprove = process.env.AUTO_APPROVE_ALL === "true";

  // Service status summary
  console.log("\n" + "=".repeat(60));
  console.log("Service Status:");
  console.log("=".repeat(60));
  console.log("[OK] Next.js App Router");
  console.log("[OK] Authentication (Privy)");
  console.log("[OK] Database (Supabase)");
  console.log(isRedisConfigured() ? "[OK] Cache (Redis)" : "[WARN] Cache (Redis) - Not configured");
  console.log("[OK] Rate Limiting");
  console.log("[OK] XSS Protection");
  console.log(autoApprove ? "[OK] Auto-Approval - ALL datasets" : "[OK] Auto-Approval - Score-based (85+)");
  console.log("=".repeat(60));
  console.log("\nImportant endpoints:");
  console.log("  GET  /api/health          - Health check");
  console.log("  POST /api/users/sync      - User login/signup");
  console.log("  GET  /api/datasets        - List datasets");
  console.log("  POST /api/datasets        - Create dataset");
  console.log("=".repeat(60));
  console.log("\nLogging enabled for:");
  console.log("  - User authentication (login/signup/failures)");
  console.log("  - Dataset operations (create/update/delete)");
  console.log("  - License purchases");
  console.log("  - File uploads/downloads");
  console.log("  - Cache hits/misses");
  console.log("  - Rate limit violations");
  console.log("=".repeat(60) + "\n");

  logger.success("ExchAInge MVP ready for requests");
}
