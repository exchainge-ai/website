"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Upload } from "lucide-react";
import SearchBar from "../shared/SearchBar";
import CategoryFilter from "../shared/CategoryFilter";
import DatasetCard from "../shared/DatasetCard";
import Pagination from "../shared/Pagination";
import type { ExtendedDataset } from "@/lib/types/dataset";
import { datasetDtoToCard, type DatasetDTO } from "@/lib/mappers/dataset";
import type { DatasetCategory } from "@/lib/types/dataset";
import { apiFetch, ApiError } from "@/lib/api/client";

const ITEMS_PER_PAGE = 12;

interface DatasetsSectionProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  currentUserId?: string;
  highlightDatasetId?: string;
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
  highlightDatasetId,
}: DatasetsSectionProps) => {
  const [rawDatasets, setRawDatasets] = useState<DatasetDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * Scrolls to and highlights a specific dataset when accessed via deep link.
   * Used to provide direct navigation context from upload confirmation.
   */
  useEffect(() => {
    if (highlightDatasetId && !isLoading) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`dataset-${highlightDatasetId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("animate-highlight");
          setTimeout(() => {
            element.classList.remove("animate-highlight");
          }, 3000);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [highlightDatasetId, isLoading]);

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

        const payload = await apiFetch<{ data?: DatasetDTO[] }>("/datasets", {
          query: Object.fromEntries(params.entries()),
        });
        const data: DatasetDTO[] = Array.isArray(payload.data)
          ? payload.data
          : [];

        if (!cancelled) {
          setRawDatasets(data);
        }
      } catch (fetchError) {
        console.error("[DatasetsSection] Failed to load datasets:", fetchError);
        if (!cancelled) {
          setRawDatasets([]);
          const message =
            fetchError instanceof ApiError
              ? fetchError.message
              : "Failed to load datasets. Please try again later.";
          setError(message);
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
    return rawDatasets.map((dto) =>
      datasetDtoToCard(dto, { currentUserId }),
    );
  }, [rawDatasets, currentUserId]);

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

  const paginatedDatasets = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDatasets.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredDatasets, currentPage]);

  const totalPages = Math.ceil(filteredDatasets.length / ITEMS_PER_PAGE);
  const totalDatasets = baseDatasets.length;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

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

      <div className="mb-6 relative z-10 flex items-center justify-between">
        <p className="text-gray-300 font-medium">
          Showing {paginatedDatasets.length} of {filteredDatasets.length} datasets
          {filteredDatasets.length !== totalDatasets && ` (${totalDatasets} total)`}
        </p>
        {totalPages > 1 && (
          <p className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </p>
        )}
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
          <div className="w-12 h-12 border-t-4 border-[#6DF77E] border-solid rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
          <Link href="/dashboard/upload">
            <div className="bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group border-2 border-dashed border-[#6DF77E]/40 hover:border-[#6DF77E]/60 relative ring-2 ring-[#6DF77E]/20 hover:ring-[#6DF77E]/40 h-full">
              <div className="h-48 relative overflow-hidden bg-gradient-to-br from-[#0C2B31]/40 to-[#6DF77E]/10">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Upload className="w-16 h-16 text-[#6DF77E] group-hover:scale-110 transition-transform duration-300" />
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
                  <p className="text-[#6DF77E] text-xs mb-4 italic text-center">
                    Earn revenue from your data contributions
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mb-4 justify-center">
                  <span className="bg-[#6DF77E]/10 text-[#6DF77E] px-2 py-1 rounded-lg text-xs border border-[#6DF77E]/30 font-medium">
                    AI Verified
                  </span>
                  <span className="bg-[#6DF77E]/10 text-[#6DF77E] px-2 py-1 rounded-lg text-xs border border-[#6DF77E]/30 font-medium">
                    Keep Ownership
                  </span>
                  <span className="bg-[#6DF77E]/10 text-[#6DF77E] px-2 py-1 rounded-lg text-xs border border-[#6DF77E]/30 font-medium">
                    Earn Revenue
                  </span>
                </div>
                <div className="mt-auto pt-4 border-t border-gray-700">
                  <button
                    type="button"
                    className="bg-[#6DF77E] hover:bg-[#04C61B] text-[#0C2B31] px-6 py-2 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg border border-[#6DF77E] w-full"
                  >
                    <span className="relative z-10">Get Started</span>
                  </button>
                </div>
              </div>
            </div>
          </Link>

          {paginatedDatasets.length > 0 ? (
            paginatedDatasets.map((dataset) => (
              <div
                key={dataset.id}
                id={`dataset-${dataset.id}`}
                className={dataset.id === highlightDatasetId ? "highlight-dataset" : ""}
              >
                <DatasetCard dataset={dataset} />
              </div>
            ))
          ) : (
            !isLoading && (
              <div className="col-span-3 py-16 text-center">
                <p className="text-gray-400 text-lg mb-2">
                  No datasets match your search criteria.
                </p>
                <p className="text-sm text-gray-500">
                  Try adjusting your filters or search term
                </p>
              </div>
            )
          )}
        </div>
      )}

      {!isLoading && totalPages > 1 && (
        <div className="relative z-10">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};

export default DatasetsSection;
