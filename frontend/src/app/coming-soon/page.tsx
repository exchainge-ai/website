'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Coming Soon page - redirects to Discovery
 * 
 * This page is kept for backward compatibility but redirects to /discovery
 * where all user requests and upcoming data needs are posted.
 * 
 * ROUTING CLARITY:
 * - Marketplace: Datasets available for sale (seller-posted listings)
 * - Discovery: User requests and data needs (buyer-posted requests)
 * 
 * This ensures a clean separation between what's being sold vs what people are looking for.
 */
export default function ComingSoonPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to discovery page
    router.replace('/discovery');
  }, [router]);

  // Return a loading state while redirect happens
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl font-bold text-white mb-4">Redirecting...</div>
        <p className="text-gray-400">Taking you to Discovery</p>
      </div>
    </div>
  );
}
