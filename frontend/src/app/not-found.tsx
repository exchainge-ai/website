import Link from "next/link";
import { Home, Search, Database } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-[#0C2B31]/20 to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold bg-gradient-to-r from-[#6DF77E] via-[#04C61B] to-[#6DF77E] bg-clip-text text-transparent mb-4">
            404
          </h1>
          <h2 className="text-3xl font-bold text-white mb-4">
            Page Not Found
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            This dataset doesn't exist in our universe... yet.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/"
            className="flex items-center gap-2 bg-[#6DF77E] text-[#0C2B31] px-6 py-3 rounded-lg hover:bg-[#04C61B] transition-all transform hover:scale-105 shadow-lg font-semibold"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>

          <Link
            href="/marketplace"
            className="flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-all font-semibold"
          >
            <Search className="w-5 h-5" />
            Browse Marketplace
          </Link>

          <Link
            href="/dashboard/upload"
            className="flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-all font-semibold"
          >
            <Database className="w-5 h-5" />
            Upload Dataset
          </Link>
        </div>

        <div className="mt-12 text-gray-400 text-sm">
          <p>Looking for something specific?</p>
          <p className="mt-2">
            Try searching the{" "}
            <Link href="/marketplace" className="text-[#6DF77E] hover:text-[#04C61B] underline">
              marketplace
            </Link>
            {" "}or{" "}
            <Link href="/discovery" className="text-[#6DF77E] hover:text-[#04C61B] underline">
              discovery
            </Link>
            {" "}page
          </p>
        </div>
      </div>
    </div>
  );
}
