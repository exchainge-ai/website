"use client";
import {
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Star,
  XCircle,
} from "lucide-react";
// Performance optimization imports removed
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
// @jsx React.createElement
// @jsxFrag React.Fragment
import React, { useCallback, useMemo, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import type { DatasetStatus, ExtendedDataset } from "@/lib/types/dataset";
import { DATASET_STATUS } from "@/lib/types/dataset";
import { PurchaseLicenseModal } from "@/components/modals/PurchaseLicenseModal";

interface DatasetCardProps {
  dataset: ExtendedDataset;
}

/**
 * A unified dataset card component for displaying both sample and user datasets
 */
const DatasetCard: React.FC<DatasetCardProps> = ({ dataset }) => {
  const router = useRouter();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const { authenticated, login } = usePrivy();
  const cardRef = useRef<HTMLDivElement>(null);

  // Pre-fetch route for user's datasets - this improves navigation performance
  React.useEffect(() => {
    if (dataset.isUserUploaded && !dataset.isMarketplaceOnly) {
      const url = `/dashboard/dataset/${encodeURIComponent(dataset.id)}`;
      router.prefetch(url);
    }
  }, [dataset.id, dataset.isUserUploaded, dataset.isMarketplaceOnly, router]);

  // Determine status badge display
  const getStatusBadge = useCallback(() => {
    if (dataset.status === DATASET_STATUS.LIVE) {
      return (
        <div
          className="absolute top-4 left-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg border border-green-400/30"
          aria-label="Verified with score"
        >
          <CheckCircle className="w-3 h-3" />
          {dataset.verificationScore || "Live"}
          {dataset.verificationScore && "%"}
        </div>
      );
    } else if (dataset.status === DATASET_STATUS.PENDING) {
      return (
        <div
          className="absolute top-4 left-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg border border-yellow-400/30"
          aria-label="Pending verification"
        >
          <Clock className="w-3 h-3" />
          Pending
        </div>
      );
    } else if (dataset.status === DATASET_STATUS.REJECTED) {
      return (
        <div
          className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-rose-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg border border-red-400/30"
          aria-label="Rejected verification"
        >
          <XCircle className="w-3 h-3" />
          Rejected
        </div>
      );
    } else if (dataset.verificationScore) {
      // Fallback to verification score if no status is available
      return (
        <div
          className="absolute top-4 left-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg border border-green-400/30"
          aria-label="Verification score"
        >
          <CheckCircle className="w-3 h-3" />
          {dataset.verificationScore}%
        </div>
      );
    }
    return null;
  }, [dataset.status, dataset.verificationScore]);

  // Pre-compute styles and classnames for better performance
  // This avoids costly string interpolations during render
  const styles = useMemo(() => {
    const isUserUploaded = dataset.isUserUploaded || false;

    return {
      cardStyle: isUserUploaded
        ? "border-2 border-[#6DF77E]/40 hover:border-[#6DF77E]/60 relative ring-2 ring-[#6DF77E]/20 hover:ring-[#6DF77E]/40"
        : "border border-gray-700 hover:border-blue-500",

      accentColor: isUserUploaded ? "green" : "blue",
      buttonColor: isUserUploaded ? "green" : "blue",

      // Pre-computed classnames for frequently used elements
      categoryBadge: `bg-gray-900/80 ${isUserUploaded ? "text-[#6DF77E]" : "text-blue-300"} px-3 py-1 rounded-full text-sm font-semibold ${isUserUploaded ? "border border-[#6DF77E]/30" : "border border-blue-500/30"} shadow-sm backdrop-blur-sm`,

      downloadIcon: `w-4 h-4 ${isUserUploaded ? "text-[#6DF77E]" : "text-blue-400"}`,
      fileTextIcon: `w-4 h-4 ${isUserUploaded ? "text-[#6DF77E]" : "text-blue-400"}`,
      calendarIcon: `w-4 h-4 ${isUserUploaded ? "text-[#6DF77E]" : "text-blue-400"}`,

      sizeTag: `text-xs ${isUserUploaded ? "bg-[#6DF77E]/10 text-[#6DF77E] border border-[#6DF77E]/30" : "bg-blue-900/30 text-blue-300 border border-blue-500/30"} px-2 py-1 rounded font-semibold`,

      actionButton: `${isUserUploaded ? "bg-[#6DF77E] text-[#03241f]" : "bg-[#6DF77E] text-[#03241f]"} inline-flex items-center justify-center gap-2 rounded-lg border border-[#6DF77E]/20 px-4 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#04C61B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#04C61B] shadow-[0_14px_30px_-20px_rgba(99,247,125,0.9)]`,

      tags: isUserUploaded
        ? "bg-[#6DF77E]/10 text-[#6DF77E] px-2 py-1 rounded-lg text-xs border border-[#6DF77E]/30 font-medium"
        : "bg-blue-900/30 text-blue-300 px-2 py-1 rounded-lg text-xs border border-blue-500/30 font-medium",
    };
  }, [dataset.isUserUploaded]);

  const displayPrice = useMemo(() => {
    if (!dataset.price) return "";
    return dataset.price.replace(/^\s*\$/, "").trim();
  }, [dataset.price]);

  return (
    <div
      ref={cardRef}
      className={`bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group ${styles.cardStyle} flex flex-col h-full`}
    >
      {/* Image - with optimized loading */}
      <div className="h-48 relative overflow-hidden">
        {dataset.image ? (
          <>
            {/* Progressive image loading with inline SVG placeholder */}
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <FileText
                className={`w-12 h-12 ${styles.accentColor === "green" ? "text-[#6DF77E]/40" : "text-blue-400/40"}`}
              />
            </div>
            <Image
              src={dataset.image}
              alt={`Preview of ${dataset.title}`}
              // Optimize image loading strategy based on visibility importance:
              // - Priority load user datasets on dashboard for immediate visibility
              // - Eager load first few items visible above the fold
              // - Lazy load everything else to improve page load time
              priority={dataset.isUserUploaded}
              loading={dataset.isUserUploaded ? "eager" : "lazy"}
              fetchPriority={dataset.isUserUploaded ? "high" : "auto"}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMzAwIiB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzFmMjkzNyIvPjwvc3ZnPg=="
              width={400}
              height={300}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={(e) => {
                // Fallback for failed images with error logging
                const target = e.target as HTMLImageElement;
                const origSrc = target.src;
                // Use category-appropriate fallback images
                const fallbacks: Record<string, string> = {
                  Robotics: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop",
                  "Autonomous Vehicles": "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop",
                  Navigation: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&h=300&fit=crop",
                  "Human-Robot Interaction": "https://images.unsplash.com/photo-1527430253228-e93688616381?w=400&h=300&fit=crop",
                  "Sensor Data": "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=300&fit=crop",
                  "Motion Capture": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop",
                };

                // Set appropriate fallback or default to robot
                target.src =
                  dataset.category && fallbacks[dataset.category]
                    ? fallbacks[dataset.category]
                    : "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop";

                // Log error for monitoring
                console.warn(
                  `Image failed to load: ${origSrc}, using fallback for ${dataset.category || "unknown category"}`,
                );
              }}
            />
          </>
        ) : (
          <div className="h-full bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 flex items-center justify-center">
            <FileText
              className={`w-16 h-16 ${styles.accentColor === "green" ? "text-[#6DF77E]/60 group-hover:text-[#6DF77E]" : "text-blue-400/60 group-hover:text-blue-300"} transition-all duration-300 group-hover:scale-110`}
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

        {/* Category Badge */}
        <div className="absolute top-4 right-4">
          <span className={styles.categoryBadge}>{dataset.category}</span>
        </div>

        {/* Status Badge */}
        {getStatusBadge()}
      </div>

      <div className="p-6 bg-gray-800 flex flex-col flex-1">
        {/* Title and Rating */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-white line-clamp-2 flex-1 mr-2">
            {dataset.title}
          </h3>
          <div className="flex items-center gap-1 text-yellow-400 ml-2">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-semibold text-gray-300">
              {dataset.rating}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-300 mb-4 line-clamp-3 font-medium">
          {dataset.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {dataset.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className={styles.tags}>
              {tag}
            </span>
          ))}
          {dataset.tags?.length > 3 && (
            <span className="text-gray-400 text-xs font-medium">
              +{dataset.tags.length - 3} more
            </span>
          )}
        </div>

        {/* Dataset Info */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <Download className={styles.downloadIcon} />
            <span className="font-medium">{dataset.downloads}</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className={styles.fileTextIcon} />
            <span className="font-medium">{dataset.format}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className={styles.calendarIcon} />
            <span className="font-medium">{dataset.lastUpdated}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={styles.sizeTag}>{dataset.size}</span>
          </div>
        </div>

        {/* Price and Purchase/Manage Button */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-700 mt-auto">
        <div className="flex items-baseline gap-1 text-green-400">
          <span className="text-sm font-semibold">$</span>
          <span className="text-2xl font-bold tracking-tight">
            {displayPrice}
          </span>
        </div>
        {dataset.isUserUploaded && !dataset.isMarketplaceOnly ? (
          <button
            type="button"
            onClick={() => {
                const datasetId = encodeURIComponent(dataset.id);

                // Use router.push for better navigation handling
                // This keeps the React state intact and avoids a full page reload
                router.push(`/dashboard/dataset/${datasetId}`);
              }}
              // Prefetch route on hover for instant navigation
              onMouseEnter={() => {
                const url = `/dashboard/dataset/${encodeURIComponent(dataset.id)}`;
                router.prefetch(url);
              }}
              className={styles.actionButton}
            >
              <span className="relative z-10">
                {dataset.actionLabel || "Manage"}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (!authenticated) {
                  login();
                  return;
                }
                setShowPurchaseModal(true);
              }}
              className={styles.actionButton}
            >
              <span className="relative z-10">
                {authenticated ? (dataset.actionLabel || "Purchase") : "Sign In to Purchase"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Purchase Modal */}
      <PurchaseLicenseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        dataset={{
          id: dataset.id,
          title: dataset.title,
          price: dataset.price || "$0.1",
          blobId: dataset.storageCID,
        }}
      />
    </div>
  );
};

// Export with React.memo with optimized comparison to prevent unnecessary re-renders
export default React.memo(DatasetCard, (prevProps, nextProps) => {
  // Compare essential properties that would affect rendering
  // This is more accurate than just comparing IDs while still being performant

  const prevDataset = prevProps.dataset;
  const nextDataset = nextProps.dataset;

  // First check ID - if different, definitely re-render
  if (prevDataset.id !== nextDataset.id) return false;

  // Check key properties that would affect visual rendering
  return (
    prevDataset.title === nextDataset.title &&
    prevDataset.status === nextDataset.status &&
    prevDataset.isUserUploaded === nextDataset.isUserUploaded &&
    prevDataset.isMarketplaceOnly === nextDataset.isMarketplaceOnly &&
    prevDataset.verificationScore === nextDataset.verificationScore
  );
});
