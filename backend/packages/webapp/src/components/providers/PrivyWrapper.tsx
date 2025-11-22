"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { type ReactNode } from "react";
import { PrivyErrorBoundary } from "./PrivyErrorBoundary";

interface PrivyWrapperProps {
  children: ReactNode;
}

export function PrivyWrapper({ children }: PrivyWrapperProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';
  const clientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID || '';

  return (
    <PrivyProvider
      appId={appId}
      clientId={clientId}
      config={{
        embeddedWallets: {
          ethereum: {
            createOnLogin: "all-users",
          },
          solana: {
            createOnLogin: "all-users",
          },
        },
        loginMethods: ["email", "wallet", "google", "github"],
        appearance: {
          theme: "dark",
          accentColor: "#8b5cf6",
          logo: "https://api.dicebear.com/7.x/shapes/svg?seed=exchainge&backgroundColor=8b5cf6",
          showWalletLoginFirst: false,
          walletList: ["metamask", "coinbase_wallet", "rainbow"],
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
      {children}
    </PrivyProvider>
  );
}
