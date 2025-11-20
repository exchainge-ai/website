"use client";

/**
 * Sui Provider
 *
 * Wraps the app with Sui dApp Kit for wallet connection and transaction signing.
 */

import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@mysten/dapp-kit/dist/index.css";

// Configure Sui network
const NETWORK = (process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet") as
  | "testnet"
  | "mainnet"
  | "devnet";

// Create query client for React Query
const queryClient = new QueryClient();

export function SuiProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={{ [NETWORK]: { url: getFullnodeUrl(NETWORK) } }} defaultNetwork={NETWORK}>
        <WalletProvider autoConnect>{children}</WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
