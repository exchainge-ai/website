"use client";

import { usePrivy } from "@privy-io/react-auth";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Download,
  DollarSign,
  Eye,
  ExternalLink,
  Loader2,
  RefreshCw,
  Shield,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/guards/AuthGuard";
import {
  datasetDtoToCard,
  formatBytes,
  formatPriceUsd,
  type DatasetDTO,
} from "@/lib/mappers/dataset";
import { DATASET_STATUS, type DatasetStatus } from "@/lib/types/dataset";
import DatasetCard from "@/components/shared/DatasetCard";
import { LICENSE_METADATA } from "@/lib/types/license";

interface DatasetDetailContentProps {
  params: {
    id?: string;
  };
}

type StatusIndicator = {
  label: string;
  icon: React.ReactNode;
  className: string;
};

const STATUS_CONFIG: Record<DatasetStatus, StatusIndicator> = {
  [DATASET_STATUS.LIVE]: {
    label: "Live",
    icon: <CheckCircle className="w-4 h-4 text-green-400" />,
    className: "text-green-400",
  },
  [DATASET_STATUS.PENDING]: {
    label: "Pending Review",
    icon: <Clock className="w-4 h-4 text-yellow-400" />,
    className: "text-yellow-400",
  },
  [DATASET_STATUS.REJECTED]: {
    label: "Rejected",
    icon: <XCircle className="w-4 h-4 text-red-400" />,
    className: "text-red-400",
  },
  [DATASET_STATUS.DRAFT]: {
    label: "Draft",
    icon: <Clock className="w-4 h-4 text-gray-400" />,
    className: "text-gray-400",
  },
  [DATASET_STATUS.ARCHIVED]: {
    label: "Archived",
    icon: <AlertTriangle className="w-4 h-4 text-gray-400" />,
    className: "text-gray-400",
  },
};

const UPLOAD_STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; className: string }
> = {
  pending: {
    label: "Waiting to start",
    icon: <Clock className="w-4 h-4 text-yellow-400" />,
    className: "text-yellow-400",
  },
  in_progress: {
    label: "Uploading",
    icon: <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />,
    className: "text-blue-400",
  },
  complete: {
    label: "Upload complete",
    icon: <CheckCircle className="w-4 h-4 text-green-400" />,
    className: "text-green-400",
  },
  failed: {
    label: "Upload failed",
    icon: <AlertTriangle className="w-4 h-4 text-red-400" />,
    className: "text-red-400",
  },
  cancelled: {
    label: "Upload cancelled",
    icon: <XCircle className="w-4 h-4 text-gray-400" />,
    className: "text-gray-400",
  },
};

export function DatasetDetailContent({ params }: DatasetDetailContentProps) {
  const datasetId = params?.id;
  const { user, getAccessToken } = usePrivy();
  const router = useRouter();

  const [dataset, setDataset] = useState<DatasetDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const ownerId = dataset?.userId;
  const isOwner = user?.id && ownerId ? user.id === ownerId : false;

  const datasetCard = useMemo(() => {
    if (!dataset) return null;
    return datasetDtoToCard(dataset, { currentUserId: user?.id ?? undefined });
  }, [dataset, user?.id]);

  const metrics = useMemo(() => {
    if (!dataset) {
      return {
        views: 0,
        downloads: 0,
        sales: 0,
        revenue: 0,
      };
    }

    return {
      views: dataset.viewCount ?? 0,
      downloads: dataset.downloadCount ?? 0,
      sales: dataset.purchaseCount ?? 0,
      revenue: formatPriceUsd(dataset.totalRevenueUsd),
    };
  }, [dataset]);

  const fetchDataset = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!datasetId) {
      setError("Missing dataset ID");
      if (!silent) {
        setIsLoading(false);
      }
      return;
    }

    if (!silent) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error("Missing access token");
      }

      const response = await fetch(
        `/api/datasets/${encodeURIComponent(datasetId)}`,
        {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          setError("Dataset not found");
          return;
        }
        throw new Error(`Request failed with status ${response.status}`);
      }

      const payload = await response.json();
      setDataset(payload?.data ?? null);
    } catch (err) {
      console.error("[DatasetDetail] Failed to load dataset:", err);
      setError("Failed to load dataset details. Please try again later.");
      setDataset(null);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [datasetId, getAccessToken]);

  useEffect(() => {
    fetchDataset();
  }, [fetchDataset]);

  useEffect(() => {
    if (!datasetId) {
      return;
    }

    const uploadStatus = dataset?.uploadStatus ?? "complete";
    const activeStatuses: Array<DatasetDTO["uploadStatus"]> = [
      "pending",
      "in_progress",
    ];

    if (!activeStatuses.includes(uploadStatus)) {
      return;
    }

    const interval = setInterval(() => {
      void fetchDataset({ silent: true });
    }, 4000);

    return () => clearInterval(interval);
  }, [datasetId, dataset?.uploadStatus, fetchDataset]);

  const updateStatus = useCallback(
    async (nextStatus: DatasetStatus) => {
      if (!datasetId) return;

      setIsUpdating(true);
      setStatusMessage(null);

      try {
        const token = await getAccessToken();
        if (!token) {
          throw new Error("Missing access token");
        }

        const response = await fetch(
          `/api/datasets/${encodeURIComponent(datasetId)}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: nextStatus }),
          },
        );

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `Request failed (${response.status})`);
        }

        const payload = await response.json();
        setDataset(payload?.data ?? null);
        setStatusMessage("Dataset status updated successfully.");
      } catch (err) {
        console.error("[DatasetDetail] Failed to update status:", err);
        setStatusMessage("Failed to update dataset status.");
      } finally {
        setIsUpdating(false);
      }
    },
    [datasetId, getAccessToken],
  );

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error || !dataset) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 py-12 text-center">
            <h1 className="text-3xl font-bold mb-4">Dataset Unavailable</h1>
            <p className="text-gray-400 mb-6">
              {error || "We couldn't find the dataset you were looking for."}
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const statusConfig = STATUS_CONFIG[dataset.status] ?? STATUS_CONFIG.draft;
  const uploadStatusDetails =
    UPLOAD_STATUS_CONFIG[dataset.uploadStatus ?? "complete"] ??
    UPLOAD_STATUS_CONFIG.complete;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
            <button
              type="button"
              onClick={() => void fetchDataset({ silent: true })}
              className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {statusMessage && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-purple-400" />
              <p className="text-gray-200">{statusMessage}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-2xl p-8 space-y-6">
              <div>
                <p className="text-sm text-gray-400 mb-2">Status</p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-900/70 border border-gray-700 rounded-full">
                  {statusConfig.icon}
                  <span className={`text-sm font-semibold ${statusConfig.className}`}>
                    {statusConfig.label}
                  </span>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-4">{dataset.title}</h1>
                <p className="text-gray-300 leading-relaxed">
                  {dataset.description}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-4">
                  <p className="text-sm text-gray-400">Price</p>
                  <p className="text-2xl font-semibold text-green-400">
                    {formatPriceUsd(dataset.priceUsd)}
                  </p>
                </div>
                <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-4">
                  <p className="text-sm text-gray-400">Category</p>
                  <p className="text-xl font-semibold">
                    {dataset.categoryLabel}
                  </p>
                </div>
                <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-4">
                  <p className="text-sm text-gray-400">Format</p>
                  <p className="text-xl font-semibold">{dataset.fileFormat}</p>
                </div>
                <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-4">
                  <p className="text-sm text-gray-400">Size</p>
                  <p className="text-xl font-semibold">
                    {dataset.sizeFormatted ?? formatBytes(dataset.sizeBytes)}
                  </p>
                </div>
              </div>
              {dataset.tags?.length ? (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {dataset.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-purple-900/30 text-purple-300 rounded-full text-xs border border-purple-500/20"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {isOwner && (
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-800">
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => updateStatus(DATASET_STATUS.LIVE)}
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 px-4 py-2 rounded-xl font-semibold transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark as Live
                  </button>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => updateStatus(DATASET_STATUS.PENDING)}
                    className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-60 px-4 py-2 rounded-xl font-semibold transition-colors"
                  >
                    <Clock className="w-4 h-4" />
                    Mark as Pending
                  </button>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => updateStatus(DATASET_STATUS.ARCHIVED)}
                    className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-60 px-4 py-2 rounded-xl font-semibold transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Archive Dataset
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Upload Status</h2>
                  <div
                    className={`inline-flex items-center gap-2 ${uploadStatusDetails.className}`}
                  >
                    {uploadStatusDetails.icon}
                    <span className="text-sm font-semibold">
                      {uploadStatusDetails.label}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>Progress</span>
                    <span className="font-semibold text-gray-200">
                      {Math.round(dataset.uploadProgress ?? 0)}%
                    </span>
                  </div>
                  <div className="mt-3 h-2 bg-gray-900 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-purple-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, dataset.uploadProgress ?? 0),
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                {dataset.uploadStatus !== "complete" ? (
                  <p className="text-xs text-gray-400">
                    Upload started{" "}
                    {dataset.uploadStartedAt
                      ? new Date(dataset.uploadStartedAt).toLocaleString()
                      : "recently"}
                    . You can safely navigate away — we'll keep uploading in the
                    background.
                  </p>
                ) : dataset.uploadCompletedAt ? (
                  <p className="text-xs text-gray-500">
                    Completed{" "}
                    {new Date(dataset.uploadCompletedAt).toLocaleString()}.
                  </p>
                ) : null}
              </div>

              {dataset.blockchainExplorerUrl && (
                <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-400" />
                    <h2 className="text-lg font-semibold">Blockchain Proof</h2>
                  </div>
                  <p className="text-sm text-gray-300">
                    This dataset has been registered on the Solana blockchain,
                    providing immutable proof of ownership and authenticity.
                  </p>
                  <div className="space-y-2">
                    {dataset.datasetHash && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Dataset Hash</p>
                        <code className="block text-xs bg-gray-900/50 px-3 py-2 rounded-lg text-purple-300 font-mono break-all">
                          {dataset.datasetHash}
                        </code>
                      </div>
                    )}
                    {dataset.blockchainTxHash && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">
                          Transaction Hash
                        </p>
                        <code className="block text-xs bg-gray-900/50 px-3 py-2 rounded-lg text-blue-300 font-mono break-all">
                          {dataset.blockchainTxHash}
                        </code>
                      </div>
                    )}
                  </div>
                  <a
                    href={dataset.blockchainExplorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2.5 rounded-xl font-semibold transition-colors text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on Solana Explorer
                  </a>
                </div>
              )}

              {/* License Terms */}
              <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  <h2 className="text-lg font-semibold">License Terms</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">License Type</span>
                    <span className="font-semibold text-green-300">
                      {dataset.licenseType && LICENSE_METADATA[dataset.licenseType as keyof typeof LICENSE_METADATA]
                        ? LICENSE_METADATA[dataset.licenseType as keyof typeof LICENSE_METADATA].label
                        : "Royalty-Free"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className={`text-2xl mb-1 ${dataset.canCommercialUse ? "text-green-400" : "text-gray-500"}`}>
                        {dataset.canCommercialUse ? "✓" : "✗"}
                      </div>
                      <p className="text-xs text-gray-400">Commercial Use</p>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl mb-1 ${dataset.canResale ? "text-green-400" : "text-gray-500"}`}>
                        {dataset.canResale ? "✓" : "✗"}
                      </div>
                      <p className="text-xs text-gray-400">Resale Rights</p>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl mb-1 ${dataset.attributionRequired ? "text-yellow-400" : "text-green-400"}`}>
                        {dataset.attributionRequired ? "⚠" : "✓"}
                      </div>
                      <p className="text-xs text-gray-400">
                        {dataset.attributionRequired ? "Attribution Required" : "No Attribution"}
                      </p>
                    </div>
                  </div>
                  {dataset.attestations && dataset.attestations.length > 0 && (
                    <div className="pt-4 border-t border-green-500/20">
                      <p className="text-xs text-gray-400 mb-2">Semantic Attestations</p>
                      <div className="flex flex-wrap gap-2">
                        {dataset.attestations.map((attestation, idx) => (
                          <span
                            key={idx}
                            className="bg-green-900/30 text-green-300 px-2 py-1 rounded-full text-xs border border-green-500/20"
                          >
                            {attestation}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 italic pt-2">
                    License terms are cryptographically stored on blockchain for legal enforceability.
                  </p>
                </div>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-4">
                <h2 className="text-lg font-semibold">Performance</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Eye className="w-5 h-5 text-blue-400" />
                      <span>Views</span>
                    </div>
                    <span className="text-xl font-semibold">
                      {metrics.views.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Download className="w-5 h-5 text-purple-400" />
                      <span>Downloads</span>
                    </div>
                    <span className="text-xl font-semibold">
                      {metrics.downloads.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-300">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span>Sales</span>
                    </div>
                    <span className="text-xl font-semibold">
                      {metrics.sales.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-300">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <span>Revenue</span>
                    </div>
                    <span className="text-xl font-semibold text-green-400">
                      {metrics.revenue}
                    </span>
                  </div>
                </div>
              </div>

              {datasetCard && (
                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
                  <h3 className="text-lg font-semibold mb-4">
                    Marketplace Preview
                  </h3>
                  <DatasetCard dataset={datasetCard} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
