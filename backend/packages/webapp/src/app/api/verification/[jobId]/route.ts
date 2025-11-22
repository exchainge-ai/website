import { NextResponse } from 'next/server';
import { getJobStatus } from '@/lib/queue/verification-jobs';
import { requireAuth, handleHttpError } from '@/lib/server/auth';
import { logger } from '@/lib/server/logger';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const auth = await requireAuth(request);
    const { jobId } = await params;

    logger.info('[api/verification] Checking job status', {
      userId: auth.userId,
      jobId,
    });

    const job = getJobStatus(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Only allow users to check their own jobs
    if (job.userId !== auth.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      data: {
        id: job.id,
        status: job.status,
        result: job.result,
        error: job.error,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
      },
    });
  } catch (error) {
    logger.error('[api/verification] Error checking job status', { error });
    return handleHttpError(error);
  }
}
