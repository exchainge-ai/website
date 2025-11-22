import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/server/auth";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { metrics } from "@/lib/monitoring/metrics";
import { logger } from "@/lib/server/logger";
import { incrementDiscoveryInterest } from "@/lib/db/discovery";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const endRequest = metrics.requestStart();
  try {
    const auth = await requireAuth(request);
    enforceRateLimit(auth.privyId, { max: 60, windowMs: 60_000 });

    const rawParams = await props.params;
    const { id } = paramsSchema.parse(rawParams);

    const updated = await incrementDiscoveryInterest(id);

    if (!updated) {
      return NextResponse.json(
        { error: "Discovery entry not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: {
        id: updated.id,
        interestedCount: updated.interested_count,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      metrics.requestError(400);
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 },
      );
    }

    logger.error("Failed to increment discovery interest", {
      error: error instanceof Error ? error.message : String(error),
    });
    metrics.requestError(500);
    return NextResponse.json(
      { error: "Failed to update interest" },
      { status: 500 },
    );
  } finally {
    endRequest();
  }
}
