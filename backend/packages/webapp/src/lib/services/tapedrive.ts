import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import crypto from "node:crypto";

import { logger } from "@/lib/server/logger";

/**
 * Determines whether TapeDrive integration should be attempted.
 */
export function isTapeDriveEnabled(): boolean {
  return process.env.TAPEDRIVE_ENABLED === "true";
}

/**
 * Error raised when a TapeDrive upload fails.
 */
export class TapeDriveUploadError extends Error {
  constructor(
    message: string,
    public readonly details?: {
      stdout?: string;
      stderr?: string;
    }
  ) {
    super(message);
    this.name = "TapeDriveUploadError";
  }
}

export interface TapeDriveUploadOptions {
  filename: string;
  contentType?: string;
  tapeName?: string;
}

export interface TapeDriveUploadResult {
  provider: "tapedrive";
  tapeAddress: string;
  tapeName?: string;
  totalChunks?: number;
  stdout: string;
  stderr: string;
  gatewayUrl?: string | null;
}

/**
 * Uploads a file buffer to TapeDrive using the CLI.
 */
export async function uploadToTapeDrive(
  buffer: Buffer,
  options: TapeDriveUploadOptions
): Promise<TapeDriveUploadResult> {
  if (!isTapeDriveEnabled()) {
    throw new TapeDriveUploadError(
      "TapeDrive is not enabled. Set TAPEDRIVE_ENABLED=true to activate uploads."
    );
  }

  const binary = process.env.TAPEDRIVE_BIN_PATH || "tapedrive";
  const cluster = process.env.TAPEDRIVE_CLUSTER || "d";
  const keypairPath = process.env.TAPEDRIVE_KEYPAIR_PATH;
  const verbose = process.env.TAPEDRIVE_VERBOSE === "true";
  const timeoutMs = Number(process.env.TAPEDRIVE_UPLOAD_TIMEOUT_MS || 300_000);
  const gatewayBase =
    process.env.TAPEDRIVE_GATEWAY_URL &&
    process.env.TAPEDRIVE_GATEWAY_URL.trim().length > 0
      ? process.env.TAPEDRIVE_GATEWAY_URL.replace(/\/$/, "")
      : null;

  const safeBaseName = path
    .basename(options.filename)
    .replace(/[^a-zA-Z0-9._-]/g, "_");
  const tapeName =
    options.tapeName ||
    `${safeBaseName}-${crypto.randomBytes(4).toString("hex")}`;

  const tempDir = await fs.mkdtemp(path.join(tmpdir(), "tapedrive-"));
  const tempFile = path.join(tempDir, safeBaseName);

  await fs.writeFile(tempFile, buffer);

  const args: string[] = [];
  if (keypairPath) {
    args.push("-k", keypairPath);
  }
  if (cluster) {
    args.push("-u", cluster);
  }
  if (verbose) {
    args.push("-v");
  }

  args.push("write", tempFile, "-n", tapeName);

  logger.info("[tapedrive] Starting CLI upload", {
    binary,
    cluster,
    keypairPath,
    tapeName,
    tempFile,
  });

  const child = spawn(binary, args, {
    env: process.env,
    stdio: ["pipe", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";
  const startTime = Date.now();

  const onData = (data: Buffer, target: "stdout" | "stderr") => {
    const text = data.toString();
    if (target === "stdout") {
      stdout += text;
    } else {
      stderr += text;
    }
  };

  child.stdout.on("data", (data: Buffer) => onData(data, "stdout"));
  child.stderr.on("data", (data: Buffer) => onData(data, "stderr"));

  // Auto-confirm the interactive prompt.
  child.stdin.write("y\n");
  child.stdin.end();

  const exitCode: number = await new Promise((resolve, reject) => {
    let timeoutHandle: NodeJS.Timeout | null = null;

    if (timeoutMs > 0) {
      timeoutHandle = setTimeout(() => {
        child.kill("SIGTERM");
        reject(new TapeDriveUploadError("TapeDrive upload timed out", { stdout, stderr }));
      }, timeoutMs);
    }

    child.on("error", (error) => {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      reject(
        new TapeDriveUploadError(
          `Failed to start tapedrive process: ${(error as Error).message}`,
          { stdout, stderr }
        )
      );
    });

    child.on("close", (code) => {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      resolve(code ?? -1);
    });
  });

  const durationMs = Date.now() - startTime;

  await fs.rm(tempFile).catch(() => {});
  await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});

  const normalizedStdout = stdout.replace(/\r/g, "\n");
  const tapeMatch = normalizedStdout.match(/tapedrive read ([1-9A-HJ-NP-Za-km-z]+)/);
  const chunksMatch = normalizedStdout.match(/Total Chunks:\s*(\d+)/);

  if (exitCode !== 0 || !tapeMatch) {
    logger.error("[tapedrive] Upload failed", {
      exitCode,
      durationMs,
      stdout: normalizedStdout,
      stderr,
    });

    throw new TapeDriveUploadError("TapeDrive upload failed", {
      stdout: normalizedStdout,
      stderr,
    });
  }

  const tapeAddress = tapeMatch[1];
  const totalChunks = chunksMatch ? Number(chunksMatch[1]) : undefined;

  logger.success("[tapedrive] Upload complete", {
    tapeAddress,
    totalChunks,
    durationMs,
  });

  return {
    provider: "tapedrive",
    tapeAddress,
    tapeName,
    totalChunks: Number.isFinite(totalChunks) ? totalChunks : undefined,
    stdout: normalizedStdout,
    stderr,
    gatewayUrl: gatewayBase ? `${gatewayBase}/api` : null,
  };
}
