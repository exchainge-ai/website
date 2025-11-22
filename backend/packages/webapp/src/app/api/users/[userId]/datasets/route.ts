import { NextResponse } from "next/server";
import { getUserDatasets } from "@/lib/db/datasets";
import { datasetRowToDTO } from "@/lib/mappers/dataset";
import { hasSupabaseConfiguration } from "@/lib/db/supabase";
import { requireAuth, handleHttpError } from "@/lib/server/auth";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { ForbiddenError } from "@/lib/server/errors";

export async function GET(
  request: Request,
  props: { params: Promise<{ userId: string }> },
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

    const url = new URL(request.url);
    const includeArchived = url.searchParams.get("includeArchived") === "true";

    const params = await props.params;
    const targetUserId = params.userId;

    if (targetUserId !== auth.userId && !auth.isAdmin) {
      throw new ForbiddenError("Cannot access another user's datasets");
    }

    const useUserClient = targetUserId === auth.userId;
    const datasets = await getUserDatasets(targetUserId, {
      client: useUserClient ? auth.supabase : undefined,
      skipCache: useUserClient,
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
