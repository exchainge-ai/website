import { Connection, clusterApiUrl } from "@solana/web3.js";

let cachedConnection: Connection | null = null;

export function getSolanaEndpoint(): string {
  return (
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    clusterApiUrl("devnet")
  );
}

export function getSolanaConnection(): Connection {
  if (!cachedConnection) {
    cachedConnection = new Connection(getSolanaEndpoint(), "confirmed");
  }
  return cachedConnection;
}
