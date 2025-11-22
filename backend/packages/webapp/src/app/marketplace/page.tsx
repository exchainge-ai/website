"use client";

import dynamic from "next/dynamic";
import { Suspense, useState } from "react";
import HeroSection from "@/components/sections/HeroSection";
import CryptoBackground from "@/components/shared/CryptoBackground";

// Use dynamic imports with optimized loading for datasets section
// The datasets section is the most complex and resource-intensive component,
// so we load it separately with a proper skeleton to improve perceived performance
const DatasetsSection = dynamic(
  () => import("@/components/sections/DatasetsSection"),
  {
    loading: () => <DatasetsSectionSkeleton />,
    ssr: true, // Enable server-side rendering for better initial load performance
  },
);

// Create an enhanced skeleton loader for datasets section with staggered animation
// This creates a more engaging loading experience and better perceived performance
const DatasetsSectionSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
    <div className="text-center mb-12 relative z-10">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
        Marketplace
      </h2>
      <p className="text-xl text-gray-300 font-medium">
        Discovering high-quality physical AI training data...
      </p>
    </div>

    {/* Skeleton search and filter UI */}
    <div className="flex flex-col lg:flex-row gap-6 mb-8 relative z-10">
      <div className="flex-1 animate-pulse">
        <div className="h-12 bg-gray-700/50 rounded-lg"></div>
      </div>
      <div className="lg:w-64 animate-pulse">
        <div className="h-12 bg-gray-700/50 rounded-lg"></div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {/* Upload Card Skeleton */}
      <div className="bg-gray-800/60 rounded-2xl shadow-lg overflow-hidden border-2 border-dashed border-purple-500/20 animate-pulse">
        <div className="h-48 bg-purple-900/10 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-purple-700/20"></div>
        </div>
        <div className="p-6">
          <div className="h-7 bg-gray-700/50 rounded mb-3 w-2/3 mx-auto"></div>
          <div className="h-4 bg-gray-700/50 rounded mb-2 w-full mx-auto"></div>
          <div className="flex justify-center gap-2 mb-4 mt-6">
            <div className="h-6 bg-purple-900/20 rounded-full w-20"></div>
            <div className="h-6 bg-purple-900/20 rounded-full w-24"></div>
          </div>
          <div className="h-12 bg-purple-700/20 rounded-xl mt-8"></div>
        </div>
      </div>

      {/* Dataset Card Skeletons with staggered animations */}
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="bg-gray-800/60 rounded-2xl shadow-lg overflow-hidden animate-pulse"
          style={{ animationDelay: `${index * 150}ms` }} // Stagger the animation
        >
          <div className="h-48 bg-gradient-to-br from-gray-700/50 to-gray-800/50 relative">
            {/* Simulate category badge */}
            <div className="absolute top-4 right-4">
              <div className="h-6 w-24 bg-gray-700/70 rounded-full"></div>
            </div>

            {/* Simulate status badge */}
            <div className="absolute top-4 left-4">
              <div className="h-6 w-20 bg-green-700/30 rounded-full"></div>
            </div>
          </div>
          <div className="p-6">
            <div className="flex justify-between items-start mb-3">
              <div className="h-6 bg-gray-700/50 rounded mb-3 w-3/4"></div>
              <div className="h-6 bg-yellow-700/30 rounded-full w-10"></div>
            </div>
            <div className="h-4 bg-gray-700/50 rounded mb-2 w-full"></div>
            <div className="h-4 bg-gray-700/50 rounded mb-4 w-5/6"></div>
            <div className="flex gap-2 mb-4">
              <div className="h-6 bg-blue-900/20 rounded-lg w-16"></div>
              <div className="h-6 bg-blue-900/20 rounded-lg w-20"></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="h-5 bg-gray-700/40 rounded"></div>
              <div className="h-5 bg-gray-700/40 rounded"></div>
              <div className="h-5 bg-gray-700/40 rounded"></div>
              <div className="h-5 bg-gray-700/40 rounded"></div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              <div className="h-8 bg-green-700/30 rounded w-16"></div>
              <div className="h-10 bg-blue-700/30 rounded-xl w-32"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const StatsSection = dynamic(
  () => import("@/components/sections/StatsSection"),
  {
    ssr: true,
  },
);

// Defer loading of lower priority sections with priority loading
const HowItWorksSection = dynamic(
  () => import("@/components/sections/HowItWorksSection"),
  {
    loading: () => (
      <div className="h-24 flex items-center justify-center">
        Loading content...
      </div>
    ),
  },
);
const NewsletterSection = dynamic(
  () => import("@/components/sections/NewsletterSection"),
  {
    loading: () => <div className="h-16"></div>,
  },
);
const ContactSection = dynamic(
  () => import("@/components/sections/ContactSection"),
  {
    loading: () => <div className="h-16"></div>,
  },
);
const TeamSection = dynamic(() => import("@/components/sections/TeamSection"), {
  loading: () => <div className="h-16"></div>,
});

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-x-hidden">
      {/* Crypto Background Effects */}
      <CryptoBackground />

      {/* Simplified Background Effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black"></div>
      </div>

      <div className="relative z-10">
        {/* Critical above-the-fold content */}
        <HeroSection />

        {/* Load non-critical content with Suspense */}
        <Suspense
          fallback={
            <div className="h-24 flex items-center justify-center">
              Loading stats...
            </div>
          }
        >
          <StatsSection />
        </Suspense>

        <Suspense
          fallback={
            <div className="h-24 flex items-center justify-center">
              Loading content...
            </div>
          }
        >
          <HowItWorksSection />
        </Suspense>

        {/* Main datasets section - this is what's taking a long time to load */}
        <Suspense
          fallback={
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Marketplace
              </h2>
              <p className="text-xl text-gray-300 font-medium mb-8">
                Loading datasets...
              </p>
              <div className="w-12 h-12 border-t-4 border-purple-500 border-solid rounded-full animate-spin mx-auto"></div>
            </div>
          }
        >
          <DatasetsSection
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </Suspense>

        {/* Load less important sections last */}
        <Suspense fallback={<div className="h-16"></div>}>
          <NewsletterSection
            email={email}
            onEmailChange={setEmail}
            isSubscribed={isSubscribed}
            onSubmit={handleNewsletterSubmit}
          />
        </Suspense>

        <Suspense fallback={<div className="h-16"></div>}>
          <ContactSection />
        </Suspense>

        <Suspense fallback={<div className="h-16"></div>}>
          <TeamSection />
        </Suspense>
      </div>
    </div>
  );
}
