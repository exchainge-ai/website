import { NextResponse } from "next/server";
import { ensureBucketExists, getBucketName } from "@/lib/db/storage";
import { requireAuth, handleHttpError } from "@/lib/server/auth";
import { enforceRateLimit } from "@/lib/server/rate-limit";

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    enforceRateLimit(auth.privyId, { max: 10, windowMs: 60_000 });

    const body = await request.json().catch(() => ({}));
    const bucket = typeof body?.bucket === "string" && body.bucket.length > 0
      ? body.bucket
      : getBucketName();

    await ensureBucketExists(bucket);

    return NextResponse.json({ success: true, bucket });
  } catch (error) {
    return handleHttpError(error);
  }
}
