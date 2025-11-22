import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { getSuiClient, buildIssueLicenseTx, getSuiKeypair } from "@/lib/blockchain/sui-license";

const confirmSchema = z.object({
  txDigest: z.string(),
  datasetId: z.string().uuid(),
  buyerAddress: z.string().startsWith("0x"),
});

/**
 * Confirm payment and mint license NFT to buyer
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = confirmSchema.parse(body);

    const supabase = getSupabaseAdmin();
    const client = getSuiClient();

    // Verify payment transaction succeeded
    const txResult = await client.getTransactionBlock({
      digest: data.txDigest,
      options: { showEffects: true },
    });

    if (txResult.effects?.status?.status !== "success") {
      return NextResponse.json(
        { error: "Payment transaction failed" },
        { status: 400 }
      );
    }

    // Get dataset details
    const { data: dataset } = await supabase
      .from("datasets")
      .select("storage_key, title")
      .eq("id", data.datasetId)
      .single();

    if (!dataset) {
      return NextResponse.json(
        { error: "Dataset not found" },
        { status: 404 }
      );
    }

    // Issue license NFT as platform (using platform keypair)
    const keypair = getSuiKeypair();
    const tx = buildIssueLicenseTx({
      datasetBlobId: dataset.storage_key,
      licensee: data.buyerAddress,
      licenseType: "commercial",
      expiryDurationMs: 365 * 24 * 60 * 60 * 1000, // 1 year
    });

    tx.setSender(keypair.toSuiAddress());

    const result = await client.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
      options: { showEffects: true },
    });

    // Update purchase intent
    await supabase
      .from("purchase_intents")
      .update({
        status: "completed",
        payment_tx: data.txDigest,
        license_tx: result.digest,
      })
      .eq("dataset_id", data.datasetId)
      .eq("buyer_address", data.buyerAddress)
      .eq("status", "pending");

    return NextResponse.json({
      success: true,
      licenseTxDigest: result.digest,
      paymentTxDigest: data.txDigest,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.flatten() },
        { status: 400 }
      );
    }

    console.error("Confirm error:", error);
    return NextResponse.json(
      {
        error: "Failed to mint license",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
