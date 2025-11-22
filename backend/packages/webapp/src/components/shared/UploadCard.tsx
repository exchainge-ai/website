import { FileText, Upload } from "lucide-react";
import Link from "next/link";

/**
 * UploadCard component - Displays a card for uploading new datasets
 * Has the same dimensions and styling as DatasetCard for visual consistency
 */
const UploadCard: React.FC = () => {
  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group border-2 border-dashed border-purple-500/40 hover:border-purple-500/60 relative ring-2 ring-purple-500/20 hover:ring-purple-500/40">
      {/* Top section with same height as dataset card images */}
      <div className="h-48 relative overflow-hidden bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 flex items-center justify-center">
        <Upload className="w-16 h-16 text-purple-400/60 group-hover:text-purple-300 transition-all duration-300 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
      </div>

      <div className="p-6 bg-gray-800">
        {/* Title area */}
        <h3 className="text-xl font-bold text-white mb-3">Upload Dataset</h3>

        {/* Description area - matches height of dataset description */}
        <p className="text-gray-300 mb-4 h-[4.5rem] line-clamp-3 font-medium">
          Share your robotics & AI datasets and earn revenue from your data
          contributions.
        </p>

        {/* Empty space to match tags section */}
        <div className="mb-4 h-[2.5rem]"></div>

        {/* Info section - empty to match dataset info */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-300 h-[3.25rem]">
          {/* Empty cells to match layout */}
        </div>

        {/* Button section */}
        <div className="flex items-center justify-center pt-4 border-t border-gray-700">
          <Link
            href="/dashboard/upload"
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg border border-purple-600 w-full text-center"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UploadCard;
