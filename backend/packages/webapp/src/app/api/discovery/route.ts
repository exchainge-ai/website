import { NextResponse } from "next/server";
import { z } from "zod";
import type { Database } from "@exchainge/supabase/database";
import { requireAuth } from "@/lib/server/auth";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { metrics } from "@/lib/monitoring/metrics";
import { logger } from "@/lib/server/logger";
import {
  createDiscoveryEntry,
  listDiscoveryEntries,
} from "@/lib/db/discovery";
import { sanitizeDatasetInput, sanitizeHtml } from "@/lib/server/sanitize";
import {
  enforceCleanContent,
  ContentModerationError,
} from "@/lib/server/moderation";
import type { DatasetCategory } from "@/lib/types/dataset";

const VALID_DISCOVERY_TYPES = ["pinboard", "request"] as const;
type DiscoveryRow = Database["public"]["Tables"]["discovery_entries"]["Row"];

const createDiscoverySchema = z.object({
  entryType: z.enum(VALID_DISCOVERY_TYPES),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  category: z.string().min(1),
  hardwareType: z.string().optional(),
  dataSize: z.string().optional(),
  estimatedBudget: z.string().optional(),
  authorName: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const CATEGORY_SET = new Set<DatasetCategory>([
  "robotics",
  "autonomous_vehicles",
  "drone",
  "manipulation",
  "navigation",
  "sensor_data",
  "human_robot_interaction",
  "embodied_ai",
  "motion_capture",
  "other",
]);

function normalizeCategory(raw: string): DatasetCategory {
  const lowered = raw.trim().toLowerCase().replace(/\s+/g, "_");
  if (CATEGORY_SET.has(lowered as DatasetCategory)) {
    return lowered as DatasetCategory;
  }
  return "other";
}

function formatResponse(entry: DiscoveryRow | null) {
  if (!entry) {
    return null;
  }

  return {
    id: entry.id,
    entryType: entry.entry_type as "pinboard" | "request",
    title: entry.title,
    description: entry.description,
    category: entry.category,
    hardwareType: entry.hardware_type,
    dataSize: entry.data_size,
    estimatedBudget: entry.estimated_budget,
    authorName: entry.author_name,
    tags: entry.tags ?? [],
    interestedCount: entry.interested_count,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
  };
}

export async function GET(request: Request) {
  const endRequest = metrics.requestStart();
  try {
    const url = new URL(request.url);
    const rawType = url.searchParams.get("type");
    const type = VALID_DISCOVERY_TYPES.includes(
      rawType as (typeof VALID_DISCOVERY_TYPES)[number],
    )
      ? (rawType as "pinboard" | "request")
      : undefined;

    const entries = await listDiscoveryEntries({ type });
    const payload = entries.map((entry) => formatResponse(entry)!);

    return NextResponse.json({ data: payload });
  } catch (error) {
    logger.error("Failed to fetch discovery entries", {
      error: error instanceof Error ? error.message : String(error),
    });
    metrics.requestError(500);
    return NextResponse.json(
      { error: "Failed to load discovery entries" },
      { status: 500 },
    );
  } finally {
    endRequest();
  }
}

export async function POST(request: Request) {
  const endRequest = metrics.requestStart();
  try {
    const auth = await requireAuth(request);
    enforceRateLimit(auth.privyId, { max: 20, windowMs: 60_000 });

    const json = await request.json();
    const parsed = createDiscoverySchema.parse(json);

    const sanitizedCore = sanitizeDatasetInput({
      title: parsed.title,
      description: parsed.description,
      tags: parsed.tags,
    });
    enforceCleanContent(sanitizedCore);

    const sanitized = {
      ...sanitizedCore,
      hardwareType: parsed.hardwareType
        ? sanitizeHtml(parsed.hardwareType)
        : undefined,
      dataSize: parsed.dataSize ? sanitizeHtml(parsed.dataSize) : undefined,
      estimatedBudget: parsed.estimatedBudget
        ? sanitizeHtml(parsed.estimatedBudget)
        : undefined,
      authorName: parsed.authorName ? sanitizeHtml(parsed.authorName) : null,
    };

    const entry = await createDiscoveryEntry(auth.userId, {
      entry_type: parsed.entryType,
      title: sanitized.title!,
      description: sanitized.description!,
      category: normalizeCategory(parsed.category),
      hardware_type: sanitized.hardwareType ?? null,
      data_size: sanitized.dataSize ?? null,
      estimated_budget: sanitized.estimatedBudget ?? null,
      author_name: sanitized.authorName,
      tags: sanitized.tags ?? [],
    });

    if (!entry) {
      throw new Error("Failed to create discovery entry");
    }

    return NextResponse.json({ data: formatResponse(entry) });
  } catch (error) {
    if (error instanceof ContentModerationError) {
      metrics.requestError(400);
      logger.warn("Discovery entry blocked by moderation", {
        field: error.field,
      });
      return NextResponse.json(
        {
          error: "Content failed moderation checks.",
          field: error.field,
        },
        { status: 400 },
      );
    }

    if (error instanceof z.ZodError) {
      metrics.requestError(400);
      return NextResponse.json(
        { error: "Validation failed", details: error.flatten() },
        { status: 400 },
      );
    }

    logger.error("Failed to create discovery entry", {
      error: error instanceof Error ? error.message : String(error),
    });
    metrics.requestError(500);
    return NextResponse.json(
      { error: "Failed to create discovery entry" },
      { status: 500 },
    );
  } finally {
    endRequest();
  }
}
