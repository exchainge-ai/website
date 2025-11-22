import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getDatasetById,
  updateDataset,
  removeDataset,
} from "@/lib/db/datasets";
import { datasetRowToDTO } from "@/lib/mappers/dataset";
import { hasSupabaseConfiguration } from "@/lib/db/supabase";
import type { DatasetStatus } from "@/lib/types/dataset";
import { requireAuth, handleHttpError } from "@/lib/server/auth";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { ForbiddenError } from "@/lib/server/errors";
import { sanitizeDatasetInput } from "@/lib/server/sanitize";
import {
  enforceCleanContent,
  ContentModerationError,
} from "@/lib/server/moderation";

const updateDatasetSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  priceUsd: z.union([z.string(), z.number()]).optional(),
  status: z
    .enum(["draft", "pending", "live", "rejected", "archived"])
    .optional(),
  verificationScore: z.number().int().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
  isMarketplaceOnly: z.boolean().optional(),
});

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    if (!hasSupabaseConfiguration()) {
      return NextResponse.json(
        { error: "Supabase is not configured for this environment." },
        { status: 503 },
      );
    }

    const auth = await requireAuth(request);
    enforceRateLimit(auth.privyId, { max: 60, windowMs: 60_000 });

    const params = await props.params;
    let dataset = await getDatasetById(params.id, {
      skipCache: true,
      client: auth.supabase,
    });

    if (!dataset && auth.isAdmin) {
      dataset = await getDatasetById(params.id, {
        skipCache: true,
      });
    }

    if (!dataset) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
    }

    const dto = datasetRowToDTO(dataset);
    return NextResponse.json({ data: dto });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    if (!hasSupabaseConfiguration()) {
      return NextResponse.json(
        { error: "Supabase is not configured for this environment." },
        { status: 503 },
      );
    }

    const auth = await requireAuth(request);
    enforceRateLimit(auth.privyId, { max: 30, windowMs: 60_000 });

    const payload = await request.json();
    const parsed = updateDatasetSchema.parse(payload);

    const sanitized = sanitizeDatasetInput({
      title: parsed.title,
      description: parsed.description,
      tags: parsed.tags,
    });
    enforceCleanContent(sanitized);

    const updates: Record<string, unknown> = {};

    if (sanitized.title !== undefined) updates.title = sanitized.title;
    if (sanitized.description !== undefined) {
      updates.description = sanitized.description;
    }
    if (sanitized.tags !== undefined) {
      updates.tags = sanitized.tags;
    }
    if (parsed.verificationScore !== undefined) {
      updates.verification_score = parsed.verificationScore;
      updates.verification_status = parsed.verificationScore >= 85;
    }
    if (parsed.isMarketplaceOnly !== undefined) {
      updates.is_marketplace_only = parsed.isMarketplaceOnly;
    }
    if (parsed.priceUsd !== undefined) {
      updates.price_usdc = String(parsed.priceUsd).replace(/[^0-9.]/g, "");
    }
    if (parsed.status !== undefined) {
      updates.status = parsed.status as DatasetStatus;
      updates.published_at =
        parsed.status === "live" ? new Date().toISOString() : null;
    }

    const params = await props.params;
    let dataset = await updateDataset(params.id, updates, {
      client: auth.supabase,
    });

    if (!dataset && auth.isAdmin) {
      dataset = await updateDataset(params.id, updates);
    }

    if (!dataset) {
      throw new ForbiddenError("Failed to update dataset");
    }

    const dto = datasetRowToDTO(dataset);
    return NextResponse.json({ data: dto });
  } catch (error) {
    if (error instanceof ContentModerationError) {
      return NextResponse.json(
        {
          error: "Content failed moderation checks.",
          field: error.field,
        },
        { status: 400 },
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.flatten() },
        { status: 400 },
      );
    }

    return handleHttpError(error);
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    if (!hasSupabaseConfiguration()) {
      return NextResponse.json(
        { error: "Supabase is not configured for this environment." },
        { status: 503 },
      );
    }

    const auth = await requireAuth(request);
    enforceRateLimit(auth.privyId, { max: 20, windowMs: 60_000 });

    const params = await props.params;
    let success = await removeDataset(params.id, {
      client: auth.supabase,
    });

    if (!success && auth.isAdmin) {
      success = await removeDataset(params.id);
    }

    if (!success) {
      throw new ForbiddenError("Failed to delete dataset");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleHttpError(error);
  }
}
