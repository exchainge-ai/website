"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Upload } from "lucide-react";
import SearchBar from "../shared/SearchBar";
import CategoryFilter from "../shared/CategoryFilter";
import DatasetCard from "../shared/DatasetCard";
import type { ExtendedDataset } from "../shared/DatasetCard";
import { datasetDtoToCard, type DatasetDTO } from "@/lib/mappers/dataset";
import { DATASET_STATUS, type DatasetCategory } from "@/lib/types/dataset";
import { sampleDatasets } from "@/lib/data/sampleDatasets";

interface DatasetsSectionProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  currentUserId?: string;
}

const CATEGORY_LABEL_TO_SLUG: Record<string, DatasetCategory | undefined> = {
  All: undefined,
  Robotics: "robotics",
  "Autonomous Vehicles": "autonomous_vehicles",
  Navigation: "navigation",
  Manipulation: "manipulation",
  "Sensor Data": "sensor_data",
  "Motion Capture": "motion_capture",
  "Human-Robot Interaction": "human_robot_interaction",
  "Embodied AI": "embodied_ai",
  "Computer Vision": "other",
};

const FALLBACK_DATASETS: ExtendedDataset[] = sampleDatasets.map((dataset) => ({
  ...dataset,
  status: DATASET_STATUS.LIVE,
  verificationStatus:
    dataset.verificationScore && dataset.verificationScore >= 85
      ? "verified"
      : "pending",
  actionLabel: "Purchase",
  isUserUploaded: false,
}));

function labelToSlug(label: string): DatasetCategory | undefined {
  return CATEGORY_LABEL_TO_SLUG[label] ?? undefined;
}

function matchesSearch(dataset: ExtendedDataset, term: string): boolean {
  if (!term) return true;
  const normalized = term.toLowerCase().trim();
  return (
    dataset.title.toLowerCase().includes(normalized) ||
    dataset.description.toLowerCase().includes(normalized) ||
    dataset.tags.some((tag) => tag.toLowerCase().includes(normalized))
  );
}

const DatasetsSection = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  currentUserId,
}: DatasetsSectionProps) => {
  const [rawDatasets, setRawDatasets] = useState<DatasetDTO[]>([]);
  const [useFallback, setUseFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchDatasets() {
      setIsLoading(true);
      setError(null);

      try {
        const categorySlug = labelToSlug(selectedCategory);
        const params = new URLSearchParams();
        if (categorySlug) {
          params.set("category", categorySlug);
        }

        const query = params.toString();
        const response = await fetch(
          `/api/datasets${query ? `?${query}` : ""}`,
          {
            cache: "no-store",
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
          setRawDatasets(data);
          setUseFallback(false);
        }
      } catch (fetchError) {
        console.error("[DatasetsSection] Failed to load datasets:", fetchError);
        if (!cancelled) {
          setRawDatasets([]);
          setUseFallback(true);
          setError("Failed to load datasets. Showing demo data instead.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchDatasets();

    return () => {
      cancelled = true;
    };
  }, [selectedCategory, reloadToken]);

  const baseDatasets: ExtendedDataset[] = useMemo(() => {
    if (useFallback) {
      return FALLBACK_DATASETS;
    }

    return rawDatasets.map((dto) =>
      datasetDtoToCard(dto, { currentUserId }),
    );
  }, [rawDatasets, useFallback, currentUserId]);

  const filteredDatasets = useMemo(() => {
    const categoryFilter =
      selectedCategory === "All" ? null : selectedCategory.toLowerCase();

    return baseDatasets.filter((dataset) => {
      const matchesCategory = categoryFilter
        ? dataset.category.toLowerCase() === categoryFilter
        : true;

      return matchesCategory && matchesSearch(dataset, searchTerm);
    });
  }, [baseDatasets, selectedCategory, searchTerm]);

  const totalDatasets = baseDatasets.length;

  const handleRetryLoading = () => {
    setReloadToken((value) => value + 1);
  };

  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gray-900 relative"
      id="datasets"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-gray-800/30 via-gray-900/30 to-black/30" />
      <div className="text-center mb-12 relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Marketplace
        </h2>
        <p className="text-xl text-gray-300 font-medium">
          Discover high-quality physical AI training data
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mb-8 relative z-10">
        <div className="flex-1">
          <SearchBar searchTerm={searchTerm} onSearchChange={onSearchChange} />
        </div>
        <div className="lg:w-64">
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
          />
        </div>
      </div>

      <div className="mb-6 relative z-10">
        <p className="text-gray-300 font-medium">
          Showing {filteredDatasets.length} of {totalDatasets} datasets
        </p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-8 flex items-center gap-3 relative z-10">
          <AlertTriangle className="text-red-400 w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-200">{error}</p>
            <button
              type="button"
              onClick={handleRetryLoading}
              className="mt-2 text-sm text-red-300 hover:text-red-100 underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12 relative z-10">
          <div className="w-12 h-12 border-t-4 border-purple-500 border-solid rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
          <Link href="/dashboard/upload">
            <div className="bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group border-2 border-dashed border-purple-500/40 hover:border-purple-500/60 relative ring-2 ring-purple-500/20 hover:ring-purple-500/40 h-full">
              <div className="h-48 relative overflow-hidden bg-gradient-to-br from-purple-900/20 to-blue-900/20">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Upload className="w-16 h-16 text-purple-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              <div className="p-6 bg-gray-800 flex flex-col h-full">
                <h3 className="text-xl font-bold text-white mb-3 text-center">
                  Upload Dataset
                </h3>
                <div className="mb-4">
                  <p className="text-gray-300 mb-2 text-center font-medium">
                    Share your robotics & AI datasets
                  </p>
                  <p className="text-purple-400 text-xs mb-4 italic text-center">
                    Earn revenue from your data contributions
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mb-4 justify-center">
                  <span className="bg-purple-900/30 text-purple-300 px-2 py-1 rounded-lg text-xs border border-purple-500/30 font-medium">
                    AI Verified
                  </span>
                  <span className="bg-purple-900/30 text-purple-300 px-2 py-1 rounded-lg text-xs border border-purple-500/30 font-medium">
                    Keep Ownership
                  </span>
                  <span className="bg-purple-900/30 text-purple-300 px-2 py-1 rounded-lg text-xs border border-purple-500/30 font-medium">
                    Earn Revenue
                  </span>
                </div>
                <div className="mt-auto pt-4 border-t border-gray-700">
                  <button
                    type="button"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg border border-purple-600 w-full"
                  >
                    <span className="relative z-10">Get Started</span>
                  </button>
                </div>
              </div>
            </div>
          </Link>

          {filteredDatasets.length > 0 ? (
            filteredDatasets.map((dataset) => (
              <DatasetCard key={dataset.id} dataset={dataset} />
            ))
          ) : (
            <div className="col-span-3 py-16 text-center">
              <p className="text-gray-400 text-lg">
                No datasets match your search criteria.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DatasetsSection;
