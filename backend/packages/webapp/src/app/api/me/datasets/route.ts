import { NextResponse } from "next/server";
import { getUserDatasets } from "@/lib/db/datasets";
import { datasetRowToDTO } from "@/lib/mappers/dataset";
import { hasSupabaseConfiguration } from "@/lib/db/supabase";
import { requireAuth, handleHttpError } from "@/lib/server/auth";
import { enforceRateLimit } from "@/lib/server/rate-limit";

/**
 * Get datasets for the currently authenticated user
 */
export async function GET(request: Request) {
  try {
    if (!hasSupabaseConfiguration()) {
      return NextResponse.json(
        { error: "Supabase is not configured for this environment." },
        { status: 503 },
      );
    }

    const auth = await requireAuth(request);
    enforceRateLimit(auth.privyId, { max: 60, windowMs: 60_000 });

    const url = new URL(request.url);
    const includeArchived = url.searchParams.get("includeArchived") === "true";

    // Use authenticated user's ID
    const datasets = await getUserDatasets(auth.userId, {
      client: auth.supabase,
      skipCache: true,
    });

    const filtered = includeArchived
      ? datasets
      : datasets.filter((dataset) => dataset.archived_at === null);

    const data = filtered.map(datasetRowToDTO);
    return NextResponse.json({ data });
  } catch (error) {
    return handleHttpError(error);
  }
}
