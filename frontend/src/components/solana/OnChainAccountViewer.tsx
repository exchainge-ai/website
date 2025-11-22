"use client";

import { useCallback, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { Loader2, RefreshCw, Search } from "lucide-react";
import { getSolanaConnection } from "@/lib/solana/connection";

interface OnChainAccountViewerProps {
  defaultAccount?: string | null;
}

interface OnChainAccountState {
  lamports: number;
  owner: string;
  executable: boolean;
  rentEpoch: number;
  data: Uint8Array;
}

function toHex(data: Uint8Array | null): string | null {
  if (!data) {
    return null;
  }
  return Array.from(data)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function toBase64(data: Uint8Array | null): string | null {
  if (!data || typeof window === "undefined") {
    return null;
  }

  let binary = "";
  data.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function slicePreview(input: string | null, limit = 100): string | null {
  if (!input) {
    return null;
  }
  if (input.length <= limit) {
    return input;
  }
  return `${input.slice(0, limit)}…`;
}

export function OnChainAccountViewer({ defaultAccount }: OnChainAccountViewerProps) {
  const [accountAddress, setAccountAddress] = useState(defaultAccount ?? "");
  const [result, setResult] = useState<OnChainAccountState | null>(null);
  const [lastFetchedSlot, setLastFetchedSlot] = useState<number | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedAccountAddress = useMemo(
    () => accountAddress.trim(),
    [accountAddress],
  );

  const fetchAccount = useCallback(async () => {
    if (!normalizedAccountAddress) {
      setError("Enter an account address to fetch account info.");
      return;
    }

    try {
      const publicKey = new PublicKey(normalizedAccountAddress);
      setIsFetching(true);
      setError(null);

      const connection = getSolanaConnection();
      const response = await connection.getAccountInfoAndContext(publicKey, "confirmed");
      const accountInfo = response.value;

      if (!accountInfo) {
        setResult(null);
        setLastFetchedSlot(response.context.slot);
        setError("No account data found for the provided address.");
        return;
      }

      const accountData =
        accountInfo.data instanceof Uint8Array
          ? accountInfo.data
          : Uint8Array.from(accountInfo.data);

      setResult({
        lamports: accountInfo.lamports,
        owner: accountInfo.owner.toBase58(),
        executable: accountInfo.executable,
        rentEpoch: accountInfo.rentEpoch ?? -1,
        data: accountData,
      });
      setLastFetchedSlot(response.context.slot);
    } catch (err) {
      console.error("[OnChainAccountViewer] Failed to fetch account info", err);
      const message =
        err instanceof Error ? err.message : "Failed to fetch account information.";
      setError(message);
      setResult(null);
    } finally {
      setIsFetching(false);
    }
  }, [normalizedAccountAddress]);

  return (
    <div className="space-y-4 rounded-2xl border border-brand-green-light/20 bg-gray-900/70 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">On-Chain Registry Lookup</h3>
          <p className="text-xs text-gray-400">
            Fetch raw Solana account data using the configured Helius RPC endpoint.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchAccount()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-green-light px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-green-strong disabled:cursor-not-allowed disabled:bg-brand-green-light/60"
        >
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </button>
      </div>

      <div className="flex flex-col gap-2 md:flex-row">
        <label className="flex-1 text-xs font-medium text-gray-300">
          Account Address
          <div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              value={accountAddress}
              onChange={(event) => setAccountAddress(event.target.value)}
              placeholder="Enter Solana account address"
              className="flex-1 bg-transparent text-sm text-white focus:outline-none"
            />
          </div>
        </label>
        <button
          type="button"
          onClick={() => void fetchAccount()}
          disabled={isFetching}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg border border-brand-green-light/40 px-3 py-2 text-xs font-semibold text-brand-green-light/80 transition-colors hover:border-brand-green-light hover:text-brand-green-light md:mt-6"
        >
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Lookup
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200"
        >
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-3 rounded-lg border border-gray-800 bg-gray-900/80 p-4 text-xs text-gray-200">
          <div className="grid gap-2 md:grid-cols-2">
            <p>
              <span className="text-gray-400">Lamports:</span>{" "}
              <span className="font-mono text-brand-green-light/80">{result.lamports.toLocaleString()}</span>
            </p>
            <p>
              <span className="text-gray-400">Owner:</span>{" "}
              <span className="font-mono text-brand-green-light/80">{result.owner}</span>
            </p>
            <p>
              <span className="text-gray-400">Executable:</span>{" "}
              <span className="font-mono text-brand-green-light/80">
                {result.executable ? "Yes" : "No"}
              </span>
            </p>
            <p>
              <span className="text-gray-400">Rent Epoch:</span>{" "}
              <span className="font-mono text-brand-green-light/80">
                {result.rentEpoch >= 0 ? result.rentEpoch : "—"}
              </span>
            </p>
            <p>
              <span className="text-gray-400">Data Length:</span>{" "}
              <span className="font-mono text-brand-green-light/80">{result.data.length} bytes</span>
            </p>
            {lastFetchedSlot != null && (
              <p>
                <span className="text-gray-400">Fetched at slot:</span>{" "}
                <span className="font-mono text-brand-green-light/80">{lastFetchedSlot}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <details className="rounded-lg border border-gray-800 bg-gray-950/80 px-3 py-2">
              <summary className="cursor-pointer text-xs font-medium text-brand-green-light/80">
                View Base64 Data
              </summary>
              <pre className="mt-2 max-h-64 overflow-auto rounded bg-black/40 p-3 text-[10px] text-brand-green-light/80">
{slicePreview(toBase64(result.data), 1200) ?? "No data"}
              </pre>
            </details>
            <details className="rounded-lg border border-gray-800 bg-gray-950/80 px-3 py-2">
              <summary className="cursor-pointer text-xs font-medium text-brand-green-light/80">
                View Hex Data
              </summary>
              <pre className="mt-2 max-h-64 overflow-auto rounded bg-black/40 p-3 text-[10px] text-brand-green-light/80">
{slicePreview(toHex(result.data), 1200) ?? "No data"}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}
