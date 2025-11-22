"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { PrivyErrorBoundary } from "./PrivyErrorBoundary";
import { SolanaProviders } from "./SolanaProviders";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

type PrivyModule = typeof import("@privy-io/react-auth");

interface PrivyWrapperProps {
  children: ReactNode;
}

export function PrivyWrapper({ children }: PrivyWrapperProps) {
  // Read env vars directly without validation
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';
  const clientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID || '';
  const [privyModule, setPrivyModule] = useState<PrivyModule | null>(null);

  const queryClient = useMemo(() => new QueryClient(), []);
  const suiNetwork = (process.env.NEXT_PUBLIC_SUI_NETWORK as "testnet" | "mainnet") || "testnet";

  const solanaConnectors = useMemo(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    try {
      return toSolanaWalletConnectors({
        shouldAutoConnect: true,
      });
    } catch (error) {
      console.error("[PrivyWrapper] Failed to initialize Solana connectors", error);
      return undefined;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const module = await import("@privy-io/react-auth");
        if (isMounted) {
          setPrivyModule(module);
        }
      } catch (error) {
        console.error("[PrivyWrapper] Failed to load Privy provider:", error);
        if (isMounted) {
          setPrivyModule(null);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const shouldUsePrivy = Boolean(appId && clientId && privyModule);

  const content = shouldUsePrivy ? (
    (() => {
      const { PrivyProvider } = privyModule!;
      return (
        <PrivyProvider
          key="privy-provider"
          appId={appId}
          clientId={clientId}
          config={{
            embeddedWallets: {
              createOnLogin: "users-without-wallets",
              requireUserPasswordOnCreate: false,
              noPromptOnSignature: false,
            },
            loginMethods: ["email", "wallet", "google", "github"],
            supportedChains: [
              {
                id: 101, // Solana mainnet
                name: "solana",
                network: "mainnet-beta",
                nativeCurrency: { name: "SOL", symbol: "SOL", decimals: 9 },
                rpcUrls: { default: { http: ["https://api.mainnet-beta.solana.com"] } },
              },
              {
                id: "sui:testnet" as any,
                name: "Sui Testnet",
                network: "testnet",
                nativeCurrency: { name: "SUI", symbol: "SUI", decimals: 9 },
                rpcUrls: { default: { http: [getFullnodeUrl("testnet")] } },
              },
            ],
            externalWallets: {
              solana: solanaConnectors
                ? {
                    connectors: solanaConnectors,
                  }
                : undefined,
            },
            appearance: {
              theme: "dark",
              accentColor: "#8b5cf6",
              logo: "https://api.dicebear.com/7.x/shapes/svg?seed=exchainge&backgroundColor=8b5cf6",
              showWalletLoginFirst: false,
              walletList: [
                "metamask",
                "coinbase_wallet",
                "rainbow",
                "detected_solana_wallets",
                "phantom",
                "solflare",
                "backpack",
              ],
              landingHeader: "Welcome to ExchAInge",
              loginMessage: "Sign in to access AI training datasets",
              walletChainType: "ethereum-and-solana",
            },
            legal: {
              termsAndConditionsUrl: "/terms",
              privacyPolicyUrl: "/privacy",
            },
          }}
        >
          <QueryClientProvider client={queryClient}>
            <SuiClientProvider networks={{ testnet: { url: getFullnodeUrl("testnet") } }} defaultNetwork="testnet">
              <WalletProvider autoConnect>
                <SolanaProviders>
                  <div suppressHydrationWarning>{children}</div>
                </SolanaProviders>
              </WalletProvider>
            </SuiClientProvider>
          </QueryClientProvider>
        </PrivyProvider>
      );
    })()
  ) : (
    <SolanaProviders>
      <div suppressHydrationWarning>{children}</div>
    </SolanaProviders>
  );

  return (
    <PrivyErrorBoundary key="privy-error-boundary">
      <div key="privy-container" suppressHydrationWarning>
        {content}
      </div>
    </PrivyErrorBoundary>
  );
}
