/**
 * Rate limiting with Redis support for distributed systems.
 * Falls back to in-memory if Redis is unavailable.
 */

import { TooManyRequestsError } from "./errors";
import { logger } from "./logger";

interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
}

interface RateEntry {
  count: number;
  resetAt: number;
}

const DEFAULT_WINDOW_MS = 60_000; // 1 minute
const DEFAULT_MAX = 60;

// In-memory fallback
const inMemoryBuckets = new Map<string, RateEntry>();

// Try to import Redis, but don't fail if it's not available
let redisClient: any = null;
try {
  const redis = require("./../../lib/db/redis");
  if (redis && typeof redis.getRedisClient === 'function') {
    redisClient = redis.getRedisClient();
  }
} catch (error) {
  logger.warn("Redis not available for rate limiting, using in-memory fallback");
}

/**
 * Enforce rate limiting using Redis (or in-memory fallback).
 */
export async function enforceRateLimit(
  identifier: string,
  options?: RateLimiterOptions,
): Promise<void> {
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
  const max = options?.max ?? DEFAULT_MAX;

  if (redisClient) {
    await enforceRateLimitRedis(identifier, windowMs, max);
  } else {
    enforceRateLimitMemory(identifier, windowMs, max);
  }
}

/**
 * Redis-based rate limiting (production).
 */
async function enforceRateLimitRedis(
  identifier: string,
  windowMs: number,
  max: number,
): Promise<void> {
  const key = `ratelimit:${identifier}`;
  const windowSeconds = Math.ceil(windowMs / 1000);

  try {
    const current = await redisClient.incr(key);

    // Set expiry on first request
    if (current === 1) {
      await redisClient.expire(key, windowSeconds);
    }

    if (current > max) {
      const ttl = await redisClient.ttl(key);
      const retryAfter = Math.max(0, ttl);

      throw new TooManyRequestsError(
        retryAfter > 0
          ? `Too many requests. Try again in ${retryAfter} seconds.`
          : "Too many requests. Try again later.",
      );
    }
  } catch (error) {
    if (error instanceof TooManyRequestsError) {
      throw error;
    }

    // Redis error, fall back to in-memory
    logger.warn("Redis rate limiting failed, falling back to in-memory", { error });
    enforceRateLimitMemory(identifier, windowMs, max);
  }
}

/**
 * In-memory rate limiting (development/fallback).
 */
function enforceRateLimitMemory(
  identifier: string,
  windowMs: number,
  max: number,
): void {
  const now = Date.now();
  const entry = inMemoryBuckets.get(identifier);

  if (!entry || entry.resetAt <= now) {
    inMemoryBuckets.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return;
  }

  entry.count += 1;
  if (entry.count > max) {
    const retryAfter = Math.max(0, Math.ceil((entry.resetAt - now) / 1000));
    throw new TooManyRequestsError(
      retryAfter > 0
        ? `Too many requests. Try again in ${retryAfter} seconds.`
        : "Too many requests. Try again later.",
    );
  }

  // Cleanup old entries periodically
  if (Math.random() < 0.01) {
    cleanupExpiredEntries();
  }
}

/**
 * Remove expired entries from in-memory store.
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of inMemoryBuckets.entries()) {
    if (entry.resetAt <= now) {
      inMemoryBuckets.delete(key);
    }
  }
}

/**
 * Get rate limit identifier from request (IP address).
 */
export function getRateLimitIdentifier(request: Request, fallback: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || fallback;
  }

  const remoteAddr = request.headers.get("x-real-ip");
  if (remoteAddr) {
    return remoteAddr;
  }

  return fallback;
}
