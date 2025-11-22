import { CheckCircle, X } from "lucide-react";
import { useEffect } from "react";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  redirectDelay?: number;
  redirectCallback?: () => void;
}

/**
 * Success modal for providing feedback after successful operations
 * Includes auto-redirect capability and countdown
 */
export function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  redirectDelay = 3,
  redirectCallback,
}: SuccessModalProps) {
  // Handle auto-redirect if redirectCallback is provided
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isOpen && redirectCallback && redirectDelay > 0) {
      timer = setTimeout(() => {
        redirectCallback();
        onClose();
      }, redirectDelay * 1000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, redirectCallback, redirectDelay, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-purple-500/20 shadow-2xl">
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-700 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
          <p className="text-gray-300">{message}</p>
        </div>

        {redirectCallback && redirectDelay > 0 && (
          <p className="text-gray-400 text-sm text-center">
            Redirecting in {redirectDelay} seconds...
          </p>
        )}

        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2 rounded-lg font-semibold transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
