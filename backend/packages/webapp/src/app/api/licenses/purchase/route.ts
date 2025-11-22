import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { getSuiClient, buildIssueLicenseTx, getSuiKeypair } from "@/lib/blockchain/sui-license";

const purchaseSchema = z.object({
  datasetId: z.string().uuid(),
  userId: z.string(),
});

/**
 * Purchase dataset license - demo mode for hackathon
 * Platform handles transaction, user just needs to be logged in
 *
 * TODO: Add actual payment flow where buyer pays seller in SUI
 * TODO: Implement sponsored transactions for gasless UX
 * TODO: Add purchase history tracking in separate table
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = purchaseSchema.parse(body);

    const supabase = getSupabaseAdmin();
    const client = getSuiClient();
    const keypair = getSuiKeypair();

    // Get dataset details
    const { data: dataset, error: dbError } = await supabase
      .from("datasets")
      .select("id, title, storage_key, price_usdc")
      .eq("id", data.datasetId)
      .single();

    if (dbError || !dataset) {
      return NextResponse.json(
        { error: "Dataset not found" },
        { status: 404 }
      );
    }

    // Get or create buyer record with Sui address
    let { data: buyer } = await supabase
      .from("users")
      .select("id, sui_address")
      .eq("privy_id", data.userId)
      .single();

    // Generate Sui address if user doesn't have one
    if (!buyer?.sui_address) {
      const userKeypair = getSuiKeypair(); // In production, generate unique per user
      const suiAddress = userKeypair.toSuiAddress();

      await supabase
        .from("users")
        .update({ sui_address: suiAddress })
        .eq("privy_id", data.userId);

      buyer = { ...buyer, sui_address: suiAddress };
    }

    if (!buyer?.sui_address) {
      return NextResponse.json(
        { error: "Failed to get user address" },
        { status: 500 }
      );
    }

    // Issue license NFT directly (platform sponsors transaction)
    const tx = buildIssueLicenseTx({
      datasetBlobId: dataset.storage_key,
      licensee: buyer.sui_address,
      licenseType: "commercial",
      expiryDurationMs: 365 * 24 * 60 * 60 * 1000, // 1 year
    });

    tx.setSender(keypair.toSuiAddress());

    const result = await client.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
      options: { showEffects: true },
    });

    return NextResponse.json({
      success: true,
      txDigest: result.digest,
      buyerAddress: buyer.sui_address,
      datasetId: data.datasetId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.flatten() },
        { status: 400 }
      );
    }

    console.error("Purchase error:", error);
    return NextResponse.json(
      {
        error: "Failed to create purchase transaction",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
