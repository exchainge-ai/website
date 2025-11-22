import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    solanaRpc: process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? null,
    hasWalletKey: Boolean(process.env.SOLANA_WALLET_PRIVATE_KEY),
    walletKeyPrefix: process.env.SOLANA_WALLET_PRIVATE_KEY?.slice(0, 8) ?? null,
    envKeys: Object.keys(process.env).filter((key) => key.toLowerCase().includes("solana")),
  });
}
