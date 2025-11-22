import { NextResponse } from "next/server";
import { requireAuth, handleHttpError } from "@/lib/server/auth";
import { getDatasetById } from "@/lib/db/datasets";
import { registerDatasetWithBlockchain } from "@/lib/blockchain/register-dataset";
import { logger } from "@/lib/server/logger";

/**
 * POST /api/datasets/[id]/register-blockchain
 * Register a dataset on Solana blockchain
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: datasetId } = await params;
    const auth = await requireAuth(request);

    logger.info("[Blockchain API] Registration request", { datasetId, userId: auth.userId });

    // Fetch dataset to verify ownership
    const dataset = await getDatasetById(datasetId);

    if (!dataset) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
    }

    if (dataset.user_id !== auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if already registered
    if (dataset.blockchain_tx_hash) {
      logger.info("[Blockchain API] Already registered", { datasetId, txHash: dataset.blockchain_tx_hash });
      return NextResponse.json({
        success: true,
        message: "Already registered on blockchain",
        txSignature: dataset.blockchain_tx_hash,
        registryAccount: dataset.blockchain_registry_account,
        explorerUrl: dataset.blockchain_explorer_url,
      });
    }

    logger.info("[Blockchain API] Starting blockchain registration", { datasetId });

    // Register on blockchain
    const result = await registerDatasetWithBlockchain(
      datasetId,
      auth.userId,
      dataset.storage_key || datasetId,
      dataset.size_bytes || 0
    );

    if (!result.success) {
      logger.error("[Blockchain API] Registration failed", { datasetId, error: result.error });
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Blockchain registration failed",
        },
        { status: 500 }
      );
    }

    logger.success("[Blockchain API] Registration successful", {
      datasetId,
      txSignature: result.txSignature,
    });

    return NextResponse.json({
      success: true,
      txSignature: result.txSignature,
      registryAccount: result.registryAccount,
      explorerUrl: result.explorerUrl,
    });
  } catch (error) {
    logger.error("[Blockchain API] Error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return handleHttpError(error);
  }
}
