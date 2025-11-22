"use client";

import { usePrivy } from "@privy-io/react-auth";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
// This is a client component for dataset details
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { formatPriceUsd } from "@/lib/mappers/dataset";
import type { DatasetDTO } from "@/lib/mappers/dataset";
import { apiFetch, ApiError } from "@/lib/api/client";

// Dataset Detail Content component
interface DatasetViewProps {
  id: string;
}

export default function DatasetView({ id }: DatasetViewProps) {
  const { user, getAccessToken } = usePrivy();
  const router = useRouter();
  const [dataset, setDataset] = useState<DatasetDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No dataset ID provided");
      setLoading(false);
      return;
    }

    console.log(`Loading dataset with ID: ${id}`);

    const controller = new AbortController();

    async function fetchDataset() {
      try {
        const token = await getAccessToken();
        if (!token) {
          throw new Error("Missing access token");
        }

        const payload = await apiFetch<{ data?: DatasetDTO }>(
          `/datasets/${encodeURIComponent(id)}`,
          {
            token,
            signal: controller.signal,
          },
        );
        if (payload?.data) {
          setDataset(payload.data as DatasetDTO);
        } else {
          setError("Dataset not found");
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }
        console.error("Error loading dataset:", err);
        if (err instanceof ApiError && err.status === 404) {
          setError("Dataset not found");
        } else {
          const message =
            err instanceof ApiError ? err.message : "Error loading dataset";
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchDataset();

    return () => {
      controller.abort();
    };
  }, [id, getAccessToken]);

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-900 text-white">
          <div className="max-w-5xl mx-auto px-4 py-12">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-green-light"></div>
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
          <div className="max-w-5xl mx-auto px-4 py-12">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Error</h2>
              <p className="text-gray-400 mb-6">
                {error || "Dataset not found"}
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-brand-green-light hover:bg-brand-green-strong text-white px-6 py-3 rounded-xl font-semibold transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // Successfully loaded dataset
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-8">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-gray-300 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
          </div>

          <div className="bg-gray-800 rounded-2xl p-8 shadow-lg">
            <h1 className="text-3xl font-bold mb-6">{dataset.title}</h1>
            <p className="text-gray-300 mb-6">{dataset.description}</p>

            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 text-brand-green-light">
                Dataset Details
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Category</p>
                  <p className="font-medium">{dataset.categoryLabel}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Format</p>
                  <p className="font-medium">{dataset.fileFormat}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Size</p>
                  <p className="font-medium">{dataset.sizeFormatted}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Price</p>
                  <p className="font-bold text-green-400">
                    {formatPriceUsd(dataset.priceUsd)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <p className="font-medium">{dataset.status}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                type="button"
                className="bg-brand-green-light hover:bg-brand-green-strong text-white px-6 py-2 rounded-xl font-semibold transition-all"
              >
                Edit Dataset
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-xl font-semibold transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
