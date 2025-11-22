import { NextResponse } from "next/server";
import { registerDatasetWithBlockchain } from "@/lib/blockchain/register-dataset";

/**
 * DEBUG ENDPOINT - Test blockchain registration
 * DELETE THIS FILE AFTER DEBUGGING
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const datasetId = url.searchParams.get("datasetId");

  if (!datasetId) {
    return NextResponse.json({ error: "Missing datasetId parameter" }, { status: 400 });
  }

  try {
    const result = await registerDatasetWithBlockchain(
      datasetId,
      "test-user-id",
      "test-storage-key",
      1000000
    );

    return NextResponse.json({
      success: result.success,
      txSignature: result.txSignature,
      registryAccount: result.registryAccount,
      explorerUrl: result.explorerUrl,
      error: result.error,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
