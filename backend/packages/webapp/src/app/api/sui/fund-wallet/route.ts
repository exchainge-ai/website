import { NextResponse } from "next/server";
import { z } from "zod";

const fundSchema = z.object({
  address: z.string().startsWith("0x"),
});

/**
 * Fund Sui testnet wallet automatically
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = fundSchema.parse(body);

    // Call Sui testnet faucet
    const response = await fetch("https://faucet.testnet.sui.io/v1/gas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        FixedAmountRequest: {
          recipient: data.address,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Faucet error:", error);
      return NextResponse.json(
        { error: "Failed to fund wallet", details: error },
        { status: 500 }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      txDigest: result.transferredGasObjects?.[0]?.transferTxDigest,
      amount: "1 SUI",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid address", details: error.flatten() },
        { status: 400 }
      );
    }

    console.error("Fund wallet error:", error);
    return NextResponse.json(
      {
        error: "Failed to fund wallet",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
