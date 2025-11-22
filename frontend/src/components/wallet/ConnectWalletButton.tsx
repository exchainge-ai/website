"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { WalletReadyState, type WalletName } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { Loader2, LogOut, Wallet as WalletIcon } from "lucide-react";

function shortenAddress(address: string): string {
  if (address.length <= 10) {
    return address;
  }
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function ConnectWalletButton() {
  const {
    connected,
    connecting,
    disconnecting,
    connect,
    disconnect,
    publicKey,
    wallet,
    select,
    wallets,
  } = useWallet();
  const [error, setError] = useState<string | null>(null);
  const [selectedWalletName, setSelectedWalletName] = useState<WalletName | "">("");

  const addressLabel = useMemo(() => {
    if (!publicKey) {
      return null;
    }
    try {
      return shortenAddress(publicKey.toBase58());
    } catch {
      return publicKey.toString();
    }
  }, [publicKey]);

  useEffect(() => {
    if (wallet?.adapter.name) {
      setSelectedWalletName(wallet.adapter.name);
    } else if (!selectedWalletName && wallets.length > 0) {
      const first = wallets[0]?.adapter.name;
      if (first) {
        setSelectedWalletName(first);
      }
    }
  }, [wallet?.adapter.name, wallets, selectedWalletName]);

  const walletOptions = useMemo(() => {
    return wallets.map(({ adapter }) => ({
      name: adapter.name as WalletName,
      readyState: adapter.readyState,
    }));
  }, [wallets]);

  const handleSelectChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const nextName = event.target.value as WalletName | "";
      setSelectedWalletName(nextName);
      setError(null);
      if (nextName) {
        select(nextName);
      }
    },
    [select],
  );

  const handleConnect = useCallback(async () => {
    setError(null);
    try {
      if (selectedWalletName) {
        select(selectedWalletName);
      }
      await connect();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to connect wallet";
      setError(message);
    }
  }, [connect, select, selectedWalletName]);

  const handleDisconnect = useCallback(async () => {
    setError(null);
    try {
      await disconnect();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to disconnect wallet";
      setError(message);
    }
  }, [disconnect]);

  if (!wallet) {
    return (
      <button
        type="button"
        onClick={handleConnect}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-green-light px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-green-strong"
        disabled={connecting}
      >
        {connecting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <WalletIcon className="h-4 w-4" />
        )}
        Connect Solana Wallet
      </button>
    );
  }

  if (!connected) {
    return (
      <div className="flex flex-col gap-2">
        {walletOptions.length > 0 && (
          <select
            value={selectedWalletName}
            onChange={handleSelectChange}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-white focus:border-brand-green-light focus:outline-none"
          >
            {walletOptions.map(({ name, readyState }) => (
              <option key={name} value={name}>
                {name}
                {readyState === WalletReadyState.Installed
                  ? ""
                  : readyState === WalletReadyState.Loadable
                    ? " (Loadable)"
                    : " (Not Installed)"}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={handleConnect}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-green-light px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-green-strong"
          disabled={connecting}
        >
          {connecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <WalletIcon className="h-4 w-4" />
          )}
          Connect {wallet?.adapter.name ?? "Wallet"}
        </button>
        {error && (
          <p className="text-xs text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-gray-900 px-3 py-2 text-xs text-brand-green-light/60">
        {wallet.adapter.name}: {addressLabel}
      </div>
      <button
        type="button"
        onClick={handleDisconnect}
        className="inline-flex items-center gap-2 rounded-lg bg-gray-700 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-gray-600"
        disabled={disconnecting}
      >
        {disconnecting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="h-4 w-4" />
        )}
        Disconnect
      </button>
      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
