import Redis from "ioredis";
import { logger } from "@/lib/server/logger";
import { metrics } from "@/lib/monitoring/metrics";

type RedisConfig =
  | { mode: "standard"; url: string }
  | { mode: "upstash-rest"; restUrl: string; restToken: string };

let redisInstance: Redis | null = null;

function resolveRedisConfig(): RedisConfig | null {
  const directUrl = process.env.REDIS_URL;
  if (directUrl) {
    return { mode: "standard", url: directUrl };
  }

  const restUrl = process.env.UPSTASH_REDIS_REST_URL;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (restUrl && restToken) {
    return { mode: "upstash-rest", restUrl, restToken };
  }

  return null;
}

const redisConfig = resolveRedisConfig();

export function isRedisConfigured(): boolean {
  return redisConfig !== null;
}

export function getRedisClient(): Redis {
  if (!redisConfig) {
    throw new Error("Redis is not configured. Set REDIS_URL or Upstash credentials.");
  }

  if (redisConfig.mode === "upstash-rest") {
    throw new Error("A standard Redis client is unavailable when using Upstash REST mode.");
  }

  if (!redisInstance) {
    logger.info("Initializing Redis client", {
      mode: "standard",
      url: redisConfig.url.replace(/redis:\/\/([^:@]+:[^@]+@)?([^:]+).*/, "redis://***@$2:***")
    });

    redisInstance = new Redis(redisConfig.url, {
      lazyConnect: false,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      connectTimeout: 10000,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return times > 20 ? null : delay;
      },
    });

    redisInstance.on("error", (error) => {
      logger.error("Redis connection error", { error: error.message });
    });

    redisInstance.on("ready", () => {
      logger.success("Redis connection ready");
    });

    redisInstance.on("reconnecting", (delay: number) => {
      logger.warn("Redis reconnecting", { delayMs: delay });
    });

    redisInstance.on("close", () => {
      logger.warn("Redis connection closed");
    });
  }

  return redisInstance;
}

export async function closeRedisConnection(): Promise<void> {
  if (redisInstance) {
    await redisInstance.quit();
    redisInstance = null;
  }
}

type RedisCommand = (string | number)[];

async function execUpstash(
  command: RedisCommand | RedisCommand[],
): Promise<any> {
  if (!redisConfig || redisConfig.mode !== "upstash-rest") {
    throw new Error("Upstash REST is not configured.");
  }

  const isPipeline =
    Array.isArray(command) &&
    (command as RedisCommand[]).length > 0 &&
    Array.isArray((command as RedisCommand[])[0]);

  const payload = isPipeline
    ? (command as RedisCommand[])
    : (command as RedisCommand);

  const response = await fetch(redisConfig.restUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redisConfig.restToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`[Redis REST] ${response.status} ${message}`);
  }

  return response.json();
}

async function redisGet(key: string): Promise<string | null> {
  if (!redisConfig) {
    return null;
  }

  if (redisConfig.mode === "standard") {
    const client = getRedisClient();
    return client.get(key);
  }

  const result = (await execUpstash(["GET", key])) as { result: string | null };
  return result.result ?? null;
}

async function redisSet(
  key: string,
  value: string,
  ttlSeconds?: number,
): Promise<boolean> {
  if (!redisConfig) {
    return false;
  }

  if (redisConfig.mode === "standard") {
    const client = getRedisClient();
    if (ttlSeconds) {
      await client.setex(key, ttlSeconds, value);
    } else {
      await client.set(key, value);
    }
    return true;
  }

  const command: (string | number)[] = ["SET", key, value];
  if (ttlSeconds) {
    command.push("EX", ttlSeconds.toString());
  }

  const result = (await execUpstash(command)) as { result: string };
  return result.result === "OK";
}

async function redisDelete(key: string): Promise<number> {
  if (!redisConfig) {
    return 0;
  }

  if (redisConfig.mode === "standard") {
    const client = getRedisClient();
    return client.del(key);
  }

  const result = (await execUpstash(["DEL", key])) as { result: number };
  return result.result ?? 0;
}

async function redisDeletePattern(pattern: string): Promise<number> {
  if (!redisConfig) {
    return 0;
  }

  if (redisConfig.mode === "standard") {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }
    return client.del(...keys);
  }

  const keysResponse = (await execUpstash(["KEYS", pattern])) as {
    result: string[];
  };

  const keys = keysResponse.result || [];
  if (keys.length === 0) {
    return 0;
  }

  const deleteCommand: (string | number)[] = ["DEL", ...keys];
  const deleteResponse = (await execUpstash(deleteCommand)) as {
    result: number;
  };

  return deleteResponse.result ?? 0;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await redisGet(key);
    if (!raw) {
      metrics.cacheMiss();
      return null;
    }
    metrics.cacheHit();
    return JSON.parse(raw) as T;
  } catch (error) {
    metrics.cacheMiss();
    logger.error("Redis GET failed", {
      key,
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds?: number,
): Promise<boolean> {
  try {
    const serialized = JSON.stringify(value);
    return await redisSet(key, serialized, ttlSeconds);
  } catch (error) {
    logger.error("Redis SET failed", {
      key,
      ttl: ttlSeconds,
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

export async function cacheDelete(key: string): Promise<boolean> {
  try {
    const removed = await redisDelete(key);
    return removed > 0;
  } catch (error) {
    logger.error("Redis DELETE failed", {
      key,
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

export async function cacheDeletePattern(pattern: string): Promise<number> {
  try {
    return await redisDeletePattern(pattern);
  } catch (error) {
    logger.error("Redis DELETE pattern failed", {
      pattern,
      error: error instanceof Error ? error.message : String(error)
    });
    return 0;
  }
}
