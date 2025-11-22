import { NextResponse } from 'next/server';
import { requireAuth, handleHttpError } from '@/lib/server/auth';
import { enforceRateLimit } from '@/lib/server/rate-limit';
import { getPresignedUploadUrl, generateFileKey } from '@/lib/services/r2';
import { logger } from '@/lib/server/logger';

/**
 * Generate a presigned URL for direct client-to-R2 upload
 * This bypasses the Next.js API and enables fast uploads of large files with progress tracking
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    enforceRateLimit(auth.privyId, { max: 20, windowMs: 60_000 });

    const body = await request.json();
    const { filename, contentType } = body;

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: 'Missing filename or contentType' },
        { status: 400 }
      );
    }

    // Generate unique file key
    const fileKey = generateFileKey(auth.userId, filename);

    // Generate presigned URL (valid for 1 hour)
    const result = await getPresignedUploadUrl(fileKey, contentType, 3600);

    logger.info('[api/upload/presigned] Presigned URL generated', {
      userId: auth.userId,
      filename,
      fileKey,
    });

    return NextResponse.json({
      data: {
        uploadUrl: result.uploadUrl,
        key: result.key,
        publicUrl: result.publicUrl,
      },
    });
  } catch (error) {
    logger.error('[api/upload/presigned] Error generating presigned URL', { error });
    return handleHttpError(error);
  }
}
