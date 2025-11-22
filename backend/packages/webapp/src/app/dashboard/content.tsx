"use client";

/**
 * TODO: Future Enhancements for Dashboard:
 * 1. Implement server-side rendering for better SEO and performance
 * 2. Add client-side state management (Redux/Zustand) for complex state needs
 * 3. Implement analytics tracking for user interactions
 * 4. Add real-time updates using WebSockets
 * 5. Add export functionality for dataset metrics
 * 6. Implement dashboard customization options
 */

import { usePrivy } from "@privy-io/react-auth";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  Package,
  TrendingUp,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/guards/AuthGuard";
import DatasetCard, { type ExtendedDataset } from "@/components/shared/DatasetCard";
import UploadCard from "@/components/shared/UploadCard";
import {
  datasetDtoToCard,
  formatPriceUsd,
  type DatasetDTO,
} from "@/lib/mappers/dataset";
import { DATASET_STATUS } from "@/lib/types/dataset";

function parseUsd(value: string | null | undefined): number {
  if (!value) return 0;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric;
  const cleaned = value.replace(/[^0-9.]/g, "");
  const fallback = Number(cleaned);
  return Number.isFinite(fallback) ? fallback : 0;
}

/**
 * Dashboard main content component
 * Displays user's datasets and related statistics
 */
export function DashboardContent() {
  const { user, authenticated, ready, getAccessToken } = usePrivy();
  const [userDatasets, setUserDatasets] = useState<DatasetDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user-specific datasets when user object is available
  useEffect(() => {
    if (!ready) return;

    let cancelled = false;

    async function loadUserDatasets() {
      if (!authenticated) {
        setUserDatasets([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const token = await getAccessToken();
        if (!token) {
          throw new Error("Missing access token");
        }

        const response = await fetch(
          `/api/me/datasets`,
          {
            cache: "no-store",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = await response.json();
        const data: DatasetDTO[] = Array.isArray(payload.data)
          ? payload.data
          : [];

        if (!cancelled) {
          setUserDatasets(data);
        }
      } catch (fetchError) {
        console.error("[Dashboard] Failed to load datasets:", fetchError);
        if (!cancelled) {
          setError("Failed to load your datasets. Please try again later.");
          setUserDatasets([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadUserDatasets();

    return () => {
      cancelled = true;
    };
  }, [ready, authenticated, user, getAccessToken]);

  // Memoize statistics to prevent unnecessary calculations on re-renders
  const statistics = useMemo(() => {
    const totalRevenue = userDatasets.reduce(
      (sum, dataset) => sum + parseUsd(dataset.totalRevenueUsd),
      0,
    );
    const totalSales = userDatasets.reduce(
      (sum, dataset) => sum + (dataset.purchaseCount ?? 0),
      0,
    );
    const liveDatasets = userDatasets.filter(
      (dataset) => dataset.status === DATASET_STATUS.LIVE,
    ).length;

    return {
      totalRevenue,
      totalSales,
      liveDatasets,
      totalDatasets: userDatasets.length,
    };
  }, [userDatasets]);

  // Format user display name from available information
  const userDisplayName = useMemo(() => {
    if (!user) return "User";

    if (user.email?.address) {
      return user.email.address;
    }

    if (user.wallet?.address) {
      return `${user.wallet.address.slice(0, 8)}...`;
    }

    return "User";
  }, [user]);

  // Function to get status display with appropriate icon
  const renderDatasetStatus = useCallback((dataset: DatasetDTO) => {
    switch (dataset.status) {
      case DATASET_STATUS.LIVE:
        return (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-medium">Live</span>
            {dataset.verificationScore !== undefined && (
              <span className="text-xs text-gray-400">
                ({dataset.verificationScore}%)
              </span>
            )}
          </div>
        );
      case DATASET_STATUS.PENDING:
        return (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-medium">Pending</span>
          </div>
        );
      case DATASET_STATUS.REJECTED:
        return (
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 font-medium">Rejected</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400 font-medium">Unknown</span>
          </div>
        );
    }
  }, []);

  // Extract dataset IDs for prefetching
  const ownerId = user?.id ?? null;

  const datasetCards = useMemo<ExtendedDataset[]>(() => {
    const cards = userDatasets.map((dataset) =>
      datasetDtoToCard(dataset, {
        currentUserId: ownerId ?? undefined,
      }),
    );

    return cards as ExtendedDataset[];
  }, [userDatasets, ownerId]);

  return (
    <AuthGuard>
      {/* Performance optimization removed */}
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">Your Dashboard</h1>
              <p className="text-gray-400 mt-1">
                Manage your datasets and track earnings
              </p>
              {user && (
                <p className="text-sm text-purple-400 mt-1">
                  Welcome back, {userDisplayName}
                </p>
              )}
            </div>
            <Link
              href="/dashboard/upload"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
            >
              Upload New Dataset
            </Link>
          </div>

          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
              <AlertTriangle className="text-red-400 w-5 h-5 flex-shrink-0" />
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Revenue</span>
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-green-400">
                {formatPriceUsd(statistics.totalRevenue)}
              </p>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Sales</span>
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-3xl font-bold">{statistics.totalSales}</p>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Live Datasets</span>
                <Package className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-3xl font-bold">{statistics.liveDatasets}</p>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Datasets</span>
                <Package className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-3xl font-bold">{statistics.totalDatasets}</p>
            </div>
          </div>

          {/* Datasets List */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold">My Datasets</h2>
            </div>

            {isLoading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-t-2 border-purple-500 border-r-2 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading your datasets...</p>
              </div>
            ) : (
              <>
                {userDatasets.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-700/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold">
                            Dataset
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">
                            Price
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">
                            Views
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">
                            Sales
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">
                            Revenue
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {userDatasets.map((dataset) => (
                          <tr
                            key={dataset.id}
                            className="hover:bg-gray-700/30 transition-colors"
                          >
                        <td className="px-6 py-4">
                              <div>
                                <p className="font-medium">{dataset.title}</p>
                                <p className="text-sm text-gray-400">
                                  {dataset.categoryLabel}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {renderDatasetStatus(dataset)}
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-purple-400 font-semibold">
                                {formatPriceUsd(dataset.priceUsd)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4 text-gray-400" />
                                <span>
                                  {(dataset.viewCount ?? 0).toLocaleString()}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-medium">
                                {dataset.purchaseCount ?? 0}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-green-400 font-semibold">
                                {formatPriceUsd(dataset.totalRevenueUsd)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <Link
                                href={`/dashboard/dataset/${dataset.id}`}
                                className="text-purple-400 hover:text-purple-300 font-medium text-sm"
                              >
                                View Details
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <Package className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <h3 className="text-xl font-semibold mb-2">
                      No datasets yet
                    </h3>
                    <p className="text-gray-400 mb-6">
                      Upload your first dataset to start earning
                    </p>
                    <Link
                      href="/dashboard/upload"
                      className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
                    >
                      Upload Dataset
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Datasets Grid Display with UploadCard */}
          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-6">My Datasets</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Upload Card - Always visible */}
              <UploadCard />

              {/* User Datasets as Cards - filtered to exclude marketplace-only */}
              {datasetCards
                .filter((dataset) => !dataset.isMarketplaceOnly)
                .map((dataset) => (
                  <div key={`user-dataset-card-${dataset.id}`}>
                    <DatasetCard dataset={dataset} />
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
