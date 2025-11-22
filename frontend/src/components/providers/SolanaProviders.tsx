"use client";

import { type ReactNode, useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { clusterApiUrl } from "@solana/web3.js";

interface SolanaProvidersProps {
  children: ReactNode;
}

export function SolanaProviders({ children }: SolanaProvidersProps) {
  const endpoint =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    clusterApiUrl("devnet");

  const wallets = useMemo(() => {
    if (typeof window === "undefined") {
      return [];
    }
    return [
      new PhantomWalletAdapter(),
      new BackpackWalletAdapter(),
      new SolflareWalletAdapter(),
    ];
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
