"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePrivy } from "@privy-io/react-auth";
import { ArrowRight, CheckCircle2, Loader2, ShieldCheck, UploadCloud, XCircle } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api/client";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";

type RegistrationMode = "trustless" | "simple";

interface DatasetRegistrationPanelProps {
  datasetId?: string | null;
  defaultFileKey?: string | null;
  defaultFileSizeBytes?: number | null;
  defaultDatasetHash?: string | null;
  onRegistered?: (payload: unknown) => void;
}

interface RegisterDatasetResponse {
  data?: {
    datasetId?: number | string;
    method?: string;
    datasetHash?: string;
    transactionSignature?: string;
    blockchainExplorerUrl?: string;
    message?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function formatBytes(bytes?: number | null): string {
  if (!bytes || Number.isNaN(bytes)) {
    return "";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

async function computeSha256Hex(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function DatasetRegistrationPanel({
  datasetId,
  defaultFileKey,
  defaultFileSizeBytes,
  defaultDatasetHash,
  onRegistered,
}: DatasetRegistrationPanelProps) {
  const { connected, connecting, connect, publicKey } = useWallet();
  const { getAccessToken, authenticated } = usePrivy();

  const [mode, setMode] = useState<RegistrationMode>("trustless");
  const [formState, setFormState] = useState({
    datasetId: datasetId ?? "",
    fileKey: defaultFileKey ?? "",
    fileSize: defaultFileSizeBytes ? String(defaultFileSizeBytes) : "",
    internalKey: "",
    datasetHash: defaultDatasetHash ?? "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [hashing, setHashing] = useState(false);
  const [lastResponse, setLastResponse] = useState<RegisterDatasetResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      datasetId: datasetId ?? "",
    }));
  }, [datasetId]);

  useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      fileKey: defaultFileKey ?? prev.fileKey,
      fileSize: defaultFileSizeBytes ? String(defaultFileSizeBytes) : prev.fileSize,
    }));
  }, [defaultFileKey, defaultFileSizeBytes]);

  useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      datasetHash: defaultDatasetHash ?? prev.datasetHash,
    }));
  }, [defaultDatasetHash]);

  const authorityAddress = useMemo(() => publicKey?.toBase58() ?? null, [publicKey]);

  const readyToSubmit = useMemo(() => {
    if (!formState.datasetId || !formState.fileKey || !formState.fileSize) {
      return false;
    }
    if (mode === "simple" && !formState.datasetHash) {
      return false;
    }
    return true;
  }, [formState.datasetId, formState.fileKey, formState.fileSize, formState.datasetHash, mode]);

  const handleModeChange = (nextMode: RegistrationMode) => {
    setMode(nextMode);
    setMessage("");
    setStatus("idle");
  };

  const handleInputChange = (field: keyof typeof formState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleHashFromFile = useCallback(async (file: File) => {
    setHashing(true);
    setMessage("");
    try {
      const hash = await computeSha256Hex(file);
      setFormState((prev) => ({
        ...prev,
        datasetHash: hash,
        fileSize: String(file.size),
        fileKey: prev.fileKey || file.name,
      }));
      setMessage("Computed SHA-256 hash from selected file.");
    } catch (error) {
      console.error("[DatasetRegistrationPanel] Failed to compute hash", error);
      setMessage("Failed to compute hash from file. Please try again.");
      setStatus("error");
    } finally {
      setHashing(false);
    }
  }, []);

  const handleFileSelection = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }
      await handleHashFromFile(file);
    },
    [handleHashFromFile],
  );

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const submitRegistration = useCallback(async () => {
    if (!authenticated) {
      setMessage("You must be signed in with Privy before registering on-chain.");
      setStatus("error");
      return;
    }

    if (!connected) {
      try {
        await connect();
      } catch (error) {
        const reason =
          error instanceof Error ? error.message : "Failed to connect wallet. Please try again.";
        setMessage(reason);
        setStatus("error");
        return;
      }
    }

    if (!authorityAddress) {
      setMessage("Unable to determine connected wallet address. Please reconnect your wallet.");
      setStatus("error");
      return;
    }

    if (!readyToSubmit) {
      setMessage("Please fill in all required fields before submitting.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error("Missing access token");
      }

      const body: Record<string, unknown> = {
        method: mode === "trustless" ? "trustless" : "simple",
        datasetId: Number(formState.datasetId),
        fileKey: formState.fileKey,
        fileSize: Number(formState.fileSize),
        internalKey: formState.internalKey || undefined,
        authority: authorityAddress,
      };

      if (mode === "simple") {
        body.datasetHash = formState.datasetHash;
      }

      const response = await apiFetch<RegisterDatasetResponse>(
        "/datasets/register",
        {
          method: "POST",
          token,
          body,
        },
      );

      setLastResponse(response);
      setStatus("success");
      setMessage("Dataset registration submitted successfully.");
      onRegistered?.(response);
    } catch (error) {
      console.error("[DatasetRegistrationPanel] Registration failed", error);
      const reason =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to register dataset on-chain.";
      setMessage(reason);
      setStatus("error");
    }
  }, [
    authenticated,
    connected,
    connect,
    authorityAddress,
    readyToSubmit,
    getAccessToken,
    formState.datasetId,
    formState.fileKey,
    formState.fileSize,
    formState.internalKey,
    formState.datasetHash,
    mode,
    onRegistered,
  ]);

  return (
    <div className="w-full rounded-2xl border border-brand-green-light/20 bg-gray-900/60 p-6 shadow-xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Register Dataset on Solana</h3>
          <p className="text-xs text-gray-400">
            Choose a registration method and confirm the transaction with your connected wallet.
          </p>
        </div>
        <ConnectWalletButton />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleModeChange("trustless")}
          className={`flex flex-col gap-1 rounded-xl border px-4 py-3 text-left transition-colors ${
            mode === "trustless"
              ? "border-brand-green-light bg-brand-green-light/20 text-white"
              : "border-gray-700 bg-gray-800 text-gray-300 hover:border-brand-green-light/70"
          }`}
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4" />
            Trustless Register
          </span>
          <span className="text-xs text-gray-400">
            Upload file to backend and compute hash on-chain for immutability.
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange("simple")}
          className={`flex flex-col gap-1 rounded-xl border px-4 py-3 text-left transition-colors ${
            mode === "simple"
              ? "border-brand-green-light bg-brand-green-light/20 text-white"
              : "border-gray-700 bg-gray-800 text-gray-300 hover:border-brand-green-light/70"
          }`}
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <UploadCloud className="h-4 w-4" />
            Simple Register
          </span>
          <span className="text-xs text-gray-400">
            Provide a precomputed SHA-256 hash for faster registry updates.
          </span>
        </button>
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submitRegistration();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-300">
            Dataset ID
            <input
              value={formState.datasetId}
              onChange={handleInputChange("datasetId")}
              placeholder="123"
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-brand-green-light focus:outline-none"
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-gray-300">
            File Key
            <input
              value={formState.fileKey}
              onChange={handleInputChange("fileKey")}
              placeholder="datasets/abc.csv"
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-brand-green-light focus:outline-none"
              required
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-300">
            File Size (bytes)
            <input
              value={formState.fileSize}
              onChange={handleInputChange("fileSize")}
              placeholder="102400"
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-brand-green-light focus:outline-none"
              required
            />
            <span className="text-[10px] text-gray-500">
              {formState.fileSize ? formatBytes(Number(formState.fileSize)) : "\u00a0"}
            </span>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-gray-300">
            Internal Key (optional)
            <input
              value={formState.internalKey}
              onChange={handleInputChange("internalKey")}
              placeholder="custom_key"
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-brand-green-light focus:outline-none"
            />
          </label>
        </div>

        {mode === "simple" && (
          <div className="space-y-2">
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-300">
              Dataset Hash (SHA-256)
              <input
                value={formState.datasetHash}
                onChange={handleInputChange("datasetHash")}
                placeholder="abcdef1234..."
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-brand-green-light focus:outline-none"
                required
              />
            </label>

            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-800 bg-gray-900/60 p-3">
              <div>
                <p className="text-xs font-semibold text-gray-200">Need a hash?</p>
                <p className="text-[11px] text-gray-500">
                  Select a dataset file and we&apos;ll compute the SHA-256 hash locally in your browser.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-brand-green-light/40 px-3 py-2 text-xs font-medium text-green-200 transition-colors hover:border-brand-green-light hover:text-green-100">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="*/*"
                  className="hidden"
                  onChange={(event) => void handleFileSelection(event)}
                />
                <UploadCloud className="h-4 w-4" />
                Pick File
              </label>
              {(hashing || connecting) && (
                <Loader2 className="h-4 w-4 animate-spin text-brand-green-light" />
              )}
              {(hashing || connecting) && <span className="text-[11px] text-green-200">Processing...</span>}
              {!hashing && (
                <button
                  type="button"
                  onClick={() => {
                    resetFileInput();
                    setFormState((prev) => ({ ...prev, datasetHash: defaultDatasetHash ?? "" }));
                  }}
                  className="text-[11px] text-gray-400 underline-offset-2 hover:text-gray-200 hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        )}

        <div className="rounded-lg border border-gray-800 bg-gray-900/70 p-4 text-xs text-gray-400">
          <p className="mb-1">
            <span className="font-semibold text-gray-200">Connected Wallet:</span>{" "}
            {authorityAddress ? authorityAddress : "Not connected"}
          </p>
          <p>
            Your wallet will sign the on-chain instruction routed through the backend to the program{" "}
            <code className="font-mono text-green-200">2yvGQ26fz2mvPnxDa2wcTf5Y88hr9sTSJpiZdFqMyQ4L</code>.
          </p>
        </div>

        <button
          type="submit"
          disabled={status === "submitting" || hashing || !readyToSubmit}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
            status === "submitting" || hashing || !readyToSubmit
              ? "bg-brand-green-light/40 text-green-200"
              : "bg-brand-green-light text-white hover:bg-brand-green-strong"
          }`}
        >
          {status === "submitting" || hashing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ArrowRight className="h-5 w-5" />
          )}
          {mode === "trustless" ? "Register via Trustless Flow" : "Register with Precomputed Hash"}
        </button>
      </form>

      {message && (
        <div
          className={`mt-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
            status === "success"
              ? "border-green-500/40 bg-green-500/10 text-green-200"
              : status === "error"
                ? "border-red-500/40 bg-red-500/10 text-red-200"
                : "border-brand-green-light/40 bg-brand-green-light/10 text-green-200"
          }`}
          role="status"
        >
          {status === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : status === "error" ? (
            <XCircle className="h-4 w-4" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          <span>{message}</span>
        </div>
      )}

      {lastResponse?.data && (
        <div className="mt-4 space-y-2 rounded-lg border border-brand-green-light/30 bg-gray-900/60 p-4 text-xs text-green-200">
          <p className="font-semibold text-green-100">Latest Registration Response</p>
          <div className="grid gap-1">
            {lastResponse.data.method && (
              <p>
                Method: <span className="font-mono">{lastResponse.data.method}</span>
              </p>
            )}
            {lastResponse.data.datasetId && (
              <p>
                Dataset ID: <span className="font-mono">{lastResponse.data.datasetId}</span>
              </p>
            )}
            {lastResponse.data.datasetHash && (
              <p className="break-words">
                Hash: <span className="font-mono">{lastResponse.data.datasetHash}</span>
              </p>
            )}
            {lastResponse.data.transactionSignature && (
              <p className="break-words">
                Signature: <span className="font-mono">{lastResponse.data.transactionSignature}</span>
              </p>
            )}
            {lastResponse.data.blockchainExplorerUrl && (
              <a
                href={String(lastResponse.data.blockchainExplorerUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-300 underline underline-offset-2 hover:text-green-100"
              >
                View on Solana Explorer
              </a>
            )}
            {lastResponse.data.message && <p>{lastResponse.data.message}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
