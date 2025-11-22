"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import HeroSection from "@/components/sections/HeroSection";
import CryptoBackground from "@/components/shared/CryptoBackground";
import DatasetsSection from "@/components/sections/DatasetsSection";
import StatsSection from "@/components/sections/StatsSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import NewsletterSection from "@/components/sections/NewsletterSection";
import ContactSection from "@/components/sections/ContactSection";

export default function MarketplacePage() {
  const searchParams = useSearchParams();
  const highlightId = searchParams?.get("highlight");

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
              <div className="w-12 h-12 border-t-4 border-brand-green border-solid rounded-full animate-spin mx-auto"></div>
            </div>
          }
        >
          <DatasetsSection
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            highlightDatasetId={highlightId || undefined}
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
      </div>
    </div>
  );
}
