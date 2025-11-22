import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, handleHttpError } from "@/lib/server/auth";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { getUploadSession, updateUploadSession } from "@/lib/db/upload-sessions";
import { updateDataset } from "@/lib/db/datasets";
import { logger } from "@/lib/server/logger";

const updateSchema = z.object({
  sessionId: z.string().uuid(),
  status: z
    .enum(["pending", "in_progress", "complete", "failed", "cancelled"])
    .optional(),
  progress: z.number().min(0).max(100).optional(),
  chunksUploaded: z.number().int().min(0).optional(),
  chunksTotal: z.number().int().min(0).optional(),
  errorMessage: z.string().optional(),
  fileHash: z.string().length(64).optional(),
  r2UploadId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    enforceRateLimit(auth.privyId, { max: 120, windowMs: 60_000 });

    const body = await request.json();
    const parsed = updateSchema.parse(body);

    const session = await getUploadSession(parsed.sessionId);
    if (!session) {
      return NextResponse.json(
        { error: "Upload session not found" },
        { status: 404 },
      );
    }

    if (session.user_id !== auth.userId) {
      return NextResponse.json(
        { error: "Not authorized to update this session" },
        { status: 403 },
      );
    }

    logger.info("Upload session update received", {
      sessionId: session.id,
      datasetId: session.dataset_id,
      status: parsed.status,
      progress: parsed.progress,
    });

    const updates: Record<string, unknown> = {};

    if (parsed.status) {
      updates.upload_status = parsed.status;
    }

    if (parsed.progress !== undefined) {
      updates.progress_percent = parsed.progress;
    }

    if (parsed.chunksUploaded !== undefined) {
      updates.chunks_uploaded = parsed.chunksUploaded;
    }

    if (parsed.chunksTotal !== undefined) {
      updates.chunks_total = parsed.chunksTotal;
    }

    if (parsed.errorMessage !== undefined) {
      updates.error_message =
        parsed.errorMessage.length > 0 ? parsed.errorMessage : null;
    }

    if (parsed.fileHash) {
      updates.file_hash = parsed.fileHash;
    }

    if (parsed.r2UploadId) {
      updates.r2_upload_id = parsed.r2UploadId;
    }

    const nowIso = new Date().toISOString();

    if (parsed.status === "complete") {
      updates.completed_at = nowIso;
    }

    const updatedSession = await updateUploadSession(session.id, updates);

    if (!updatedSession) {
      return NextResponse.json(
        { error: "Failed to update session" },
        { status: 500 },
      );
    }

    if (session.dataset_id) {
      const datasetUpdates: Record<string, unknown> = {};

      if (parsed.status) {
        datasetUpdates.upload_status = parsed.status;
        if (parsed.status === "complete") {
          datasetUpdates.upload_completed_at = nowIso;
          datasetUpdates.upload_progress = 100;
        } else if (parsed.status === "failed") {
          datasetUpdates.upload_progress = parsed.progress ?? 0;
        }
      }

      if (
        parsed.progress !== undefined &&
        parsed.status !== "complete" &&
        parsed.status !== "failed"
      ) {
        datasetUpdates.upload_progress = parsed.progress;
        datasetUpdates.upload_status = parsed.progress === 100 ? "complete" : "in_progress";
        if (parsed.progress === 100) {
          datasetUpdates.upload_completed_at = nowIso;
        }
      }

      if (Object.keys(datasetUpdates).length > 0) {
        await updateDataset(session.dataset_id, datasetUpdates as any);
      }
    }

    return NextResponse.json({
      data: {
        session: updatedSession,
      },
    });
  } catch (error) {
    logger.error("Upload background update failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return handleHttpError(error);
  }
}
