/**
 * Advanced Marketplace Filters Component
 * Provides filtering and search for AI researchers and companies
 */

"use client";

import { Search, Filter, X } from "lucide-react";
import { useState } from "react";

interface MarketplaceFilters {
  search: string;
  category: string[];
  minSize: string;
  maxSize: string;
  qualityScore: number;
  licenseType: string[];
  hardwareType: string[];
  verificationStatus: "verified" | "pending" | "all";
  sortBy: "newest" | "popular" | "price_asc" | "price_desc" | "quality";
  updateFrequency: "daily" | "weekly" | "monthly" | "any";
}

interface AdvancedFiltersProps {
  onFiltersChange: (filters: MarketplaceFilters) => void;
  totalResults: number;
}

export function AdvancedMarketplaceFilters({
  onFiltersChange,
  totalResults,
}: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<MarketplaceFilters>({
    search: "",
    category: [],
    minSize: "0",
    maxSize: "1000",
    qualityScore: 0,
    licenseType: [],
    hardwareType: [],
    verificationStatus: "all",
    sortBy: "newest",
    updateFrequency: "any",
  });

  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: keyof MarketplaceFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters: MarketplaceFilters = {
      search: "",
      category: [],
      minSize: "0",
      maxSize: "1000",
      qualityScore: 0,
      licenseType: [],
      hardwareType: [],
      verificationStatus: "all",
      sortBy: "newest",
      updateFrequency: "any",
    };
    setFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const activeFiltersCount = [
    ...filters.category,
    ...filters.licenseType,
    ...filters.hardwareType,
    filters.qualityScore > 0 ? "quality" : null,
    filters.verificationStatus !== "all" ? "verification" : null,
    filters.updateFrequency !== "any" ? "frequency" : null,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search datasets by name, description, or tags..."
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition"
        />
      </div>

      {/* Filters Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white hover:bg-gray-600/50 transition"
        >
          <Filter className="w-4 h-4" />
          Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </button>

        <select
          value={filters.sortBy}
          onChange={(e) =>
            handleFilterChange("sortBy", e.target.value as any)
          }
          className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none transition"
        >
          <option value="newest">Newest</option>
          <option value="popular">Most Popular</option>
          <option value="quality">Best Quality</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>

        {activeFiltersCount > 0 && (
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-gray-300 hover:text-white transition"
          >
            Clear All
          </button>
        )}
      </div>

      <p className="text-sm text-gray-400">
        Showing {totalResults} result{totalResults !== 1 ? "s" : ""}
      </p>

      {/* Filters Panel */}
      {isOpen && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-gray-700/30 border border-gray-600 rounded-lg">
          {/* Category */}
          <div>
            <h3 className="font-semibold text-white mb-3">Category</h3>
            <div className="space-y-2">
              {[
                "Robotics",
                "Autonomous Vehicles",
                "Drone",
                "Sensors",
                "Human-Robot Interaction",
              ].map((cat) => (
                <label
                  key={cat}
                  className="flex items-center gap-2 text-gray-300 cursor-pointer hover:text-white"
                >
                  <input
                    type="checkbox"
                    checked={filters.category.includes(cat)}
                    onChange={(e) => {
                      const newCats = e.target.checked
                        ? [...filters.category, cat]
                        : filters.category.filter((c) => c !== cat);
                      handleFilterChange("category", newCats);
                    }}
                    className="w-4 h-4 rounded bg-gray-600 border-gray-500"
                  />
                  {cat}
                </label>
              ))}
            </div>
          </div>

          {/* Quality Score */}
          <div>
            <h3 className="font-semibold text-white mb-3">Quality Score</h3>
            <div className="space-y-3">
              <div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.qualityScore}
                  onChange={(e) =>
                    handleFilterChange("qualityScore", Number(e.target.value))
                  }
                  className="w-full"
                />
                <p className="text-sm text-gray-400 mt-2">
                  Minimum: {filters.qualityScore}%
                </p>
              </div>
            </div>
          </div>

          {/* Hardware Type */}
          <div>
            <h3 className="font-semibold text-white mb-3">Hardware Type</h3>
            <div className="space-y-2">
              {[
                "DJI",
                "NVIDIA",
                "Qualcomm",
                "Custom",
                "Multi-Hardware",
              ].map((hw) => (
                <label
                  key={hw}
                  className="flex items-center gap-2 text-gray-300 cursor-pointer hover:text-white"
                >
                  <input
                    type="checkbox"
                    checked={filters.hardwareType.includes(hw)}
                    onChange={(e) => {
                      const newHw = e.target.checked
                        ? [...filters.hardwareType, hw]
                        : filters.hardwareType.filter((h) => h !== hw);
                      handleFilterChange("hardwareType", newHw);
                    }}
                    className="w-4 h-4 rounded bg-gray-600 border-gray-500"
                  />
                  {hw}
                </label>
              ))}
            </div>
          </div>

          {/* License Type */}
          <div>
            <h3 className="font-semibold text-white mb-3">License Type</h3>
            <div className="space-y-2">
              {[
                "View Only",
                "Commercial Use",
                "AI Training",
                "Research Only",
              ].map((lic) => (
                <label
                  key={lic}
                  className="flex items-center gap-2 text-gray-300 cursor-pointer hover:text-white"
                >
                  <input
                    type="checkbox"
                    checked={filters.licenseType.includes(lic)}
                    onChange={(e) => {
                      const newLic = e.target.checked
                        ? [...filters.licenseType, lic]
                        : filters.licenseType.filter((l) => l !== lic);
                      handleFilterChange("licenseType", newLic);
                    }}
                    className="w-4 h-4 rounded bg-gray-600 border-gray-500"
                  />
                  {lic}
                </label>
              ))}
            </div>
          </div>

          {/* Size Range */}
          <div>
            <h3 className="font-semibold text-white mb-3">Dataset Size</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400">Min (GB)</label>
                <input
                  type="number"
                  value={filters.minSize}
                  onChange={(e) => handleFilterChange("minSize", e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600/50 border border-gray-500 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400">Max (GB)</label>
                <input
                  type="number"
                  value={filters.maxSize}
                  onChange={(e) => handleFilterChange("maxSize", e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600/50 border border-gray-500 rounded text-white text-sm"
                />
              </div>
            </div>
          </div>

          {/* Verification Status */}
          <div>
            <h3 className="font-semibold text-white mb-3">Verification</h3>
            <select
              value={filters.verificationStatus}
              onChange={(e) =>
                handleFilterChange("verificationStatus", e.target.value)
              }
              className="w-full px-3 py-2 bg-gray-600/50 border border-gray-500 rounded text-white text-sm focus:outline-none"
            >
              <option value="all">All</option>
              <option value="verified">Verified Only</option>
              <option value="pending">Pending Review</option>
            </select>
          </div>

          {/* Update Frequency */}
          <div>
            <h3 className="font-semibold text-white mb-3">Update Frequency</h3>
            <select
              value={filters.updateFrequency}
              onChange={(e) =>
                handleFilterChange("updateFrequency", e.target.value as any)
              }
              className="w-full px-3 py-2 bg-gray-600/50 border border-gray-500 rounded text-white text-sm focus:outline-none"
            >
              <option value="any">Any</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
