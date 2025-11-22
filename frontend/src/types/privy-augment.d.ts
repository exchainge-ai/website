import type { ReactElement } from "react";
import type { PrivyClientConfig, UserRecoveryMethod } from "@privy-io/react-auth";

type __PrivyAppearance = NonNullable<PrivyClientConfig["appearance"]>;
type __PrivyEmbedded = NonNullable<PrivyClientConfig["embeddedWallets"]>;

declare global {
  const SOLANA_CHAINS: readonly string[];
  const WALLET_CONNECT_WALLET_CLIENT_TYPES: readonly string[];
  type EmbeddedSVG = string;
  type RecoveryMethod = UserRecoveryMethod;
}

declare module "@privy-io/react-auth" {
  interface PrivyClientConfig {
    appearance?: (__PrivyAppearance & {
      footerLogo?: string | ReactElement;
    }) | undefined;
    embeddedWallets?: (__PrivyEmbedded & {
      transactionScanning?: boolean;
    }) | undefined;
    _render?: unknown;
  }
}

export {};
