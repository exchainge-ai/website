/**
 * Structured logging utility for ExchAInge MVP
 * Logs important user actions without exposing secrets
 */

type LogLevel = "info" | "warn" | "error" | "success";

interface LogContext {
  userId?: string;
  privyId?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: any;
}

function sanitizeValue(key: string, value: any): any {
  const sensitiveKeys = [
    "password",
    "token",
    "secret",
    "key",
    "authorization",
    "cookie",
    "session",
  ];

  if (typeof value === "string" && sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
    return `***${value.slice(-4)}`; // Show last 4 chars
  }

  if (typeof value === "string" && value.length > 100) {
    return `${value.slice(0, 100)}... (${value.length} chars)`;
  }

  return value;
}

function sanitizeContext(context: LogContext): LogContext {
  const sanitized: LogContext = {};

  for (const [key, value] of Object.entries(context)) {
    sanitized[key] = sanitizeValue(key, value);
  }

  return sanitized;
}

function getTimestamp(): string {
  return new Date().toISOString().split("T")[1].split(".")[0]; // HH:MM:SS
}

function colorize(level: LogLevel, text: string): string {
  const colors = {
    info: "\x1b[36m",    // Cyan
    warn: "\x1b[33m",    // Yellow
    error: "\x1b[31m",   // Red
    success: "\x1b[32m", // Green
  };
  const reset = "\x1b[0m";
  return `${colors[level]}${text}${reset}`;
}

function formatLog(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = getTimestamp();
  const levelPrefix = {
    info: "[INFO]",
    warn: "[WARN]",
    error: "[ERROR]",
    success: "[OK]",
  }[level];

  let log = `[${timestamp}] ${levelPrefix} ${colorize(level, message)}`;

  if (context && Object.keys(context).length > 0) {
    const sanitized = sanitizeContext(context);
    const contextStr = Object.entries(sanitized)
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(", ");
    log += ` | ${contextStr}`;
  }

  return log;
}

export const logger = {
  info(message: string, context?: LogContext) {
    console.log(formatLog("info", message, context));
  },

  warn(message: string, context?: LogContext) {
    console.warn(formatLog("warn", message, context));
  },

  error(message: string, context?: LogContext) {
    console.error(formatLog("error", message, context));
  },

  success(message: string, context?: LogContext) {
    console.log(formatLog("success", message, context));
  },

  // Specific event loggers
  auth: {
    login(userId: string, privyId: string, method: string) {
      logger.success("User logged in", { userId, privyId: `${privyId.slice(0, 10)}...`, method });
    },

    logout(userId: string) {
      logger.info("User logged out", { userId });
    },

    signup(userId: string, privyId: string, accountType: string) {
      logger.success("New user signed up", { userId, privyId: `${privyId.slice(0, 10)}...`, accountType });
    },

    authFailed(reason: string, ip?: string) {
      logger.warn("Authentication failed", { reason, ip });
    },
  },

  dataset: {
    created(datasetId: string, userId: string, title: string) {
      logger.success("Dataset created", { datasetId, userId, title });
    },

    updated(datasetId: string, userId: string, fields: string[]) {
      logger.info("Dataset updated", { datasetId, userId, fields: fields.join(", ") });
    },

    deleted(datasetId: string, userId: string) {
      logger.warn("Dataset deleted", { datasetId, userId });
    },

    published(datasetId: string, userId: string) {
      logger.success("Dataset published", { datasetId, userId });
    },

    unpublished(datasetId: string, userId: string) {
      logger.info("Dataset unpublished", { datasetId, userId });
    },
  },

  license: {
    purchased(licenseId: string, datasetId: string, buyerId: string, price: string) {
      logger.success("License purchased", { licenseId, datasetId, buyerId, price });
    },

    activated(licenseId: string, userId: string) {
      logger.info("License activated", { licenseId, userId });
    },

    revoked(licenseId: string, reason: string) {
      logger.warn("License revoked", { licenseId, reason });
    },
  },

  file: {
    uploaded(fileName: string, userId: string, size: number, datasetId?: string) {
      const sizeMB = (size / 1024 / 1024).toFixed(2);
      logger.success("File uploaded", { fileName, userId, sizeMB: `${sizeMB} MB`, datasetId });
    },

    downloaded(fileName: string, userId: string, datasetId: string) {
      logger.info("File downloaded", { fileName, userId, datasetId });
    },

    deleted(fileName: string, userId: string) {
      logger.warn("File deleted", { fileName, userId });
    },
  },

  cache: {
    hit(key: string) {
      logger.info("Cache hit", { key });
    },

    miss(key: string) {
      logger.info("Cache miss", { key });
    },

    invalidated(pattern: string, count: number) {
      logger.info("Cache invalidated", { pattern, count });
    },
  },

  db: {
    connected(service: string) {
      logger.success(`${service} connected`);
    },

    error(service: string, error: string) {
      logger.error(`${service} error`, { error });
    },

    query(table: string, operation: string, duration?: number) {
      if (duration && duration > 1000) {
        logger.warn("Slow query detected", { table, operation, durationMs: duration });
      }
    },
  },

  api: {
    request(method: string, path: string, userId?: string, ip?: string) {
      logger.info(`${method} ${path}`, { userId, ip });
    },

    response(method: string, path: string, status: number, duration: number) {
      const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";
      logger[level](`${method} ${path} ${status}`, { durationMs: duration });
    },

    rateLimit(userId: string, endpoint: string) {
      logger.warn("Rate limit exceeded", { userId, endpoint });
    },
  },
};
