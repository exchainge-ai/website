"use client";

import { CheckCircle, X, Shield, Copy, ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";

interface DatasetUploadSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  datasetId: string | null;
  datasetHash: string | null;
  blockchainTxHash?: string | null;
  blockchainExplorerUrl?: string | null;
}

export function DatasetUploadSuccessModal({
  isOpen,
  onClose,
  message,
  datasetId,
  datasetHash,
  blockchainTxHash,
  blockchainExplorerUrl,
}: DatasetUploadSuccessModalProps) {
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedTx, setCopiedTx] = useState(false);

  if (isOpen) {
    console.log('[DEBUG] Modal Component Loaded, Build Time: 2025-01-23T02:15:00Z');
    console.log('[DEBUG] Modal Props:', {
      datasetId,
      datasetHash,
      blockchainTxHash,
      blockchainExplorerUrl,
      hasBlockchainData: !!(blockchainTxHash && blockchainExplorerUrl),
    });
  }

  const copyHash = () => {
    if (!datasetHash) return;
    navigator.clipboard.writeText(datasetHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const copyTx = () => {
    if (!blockchainTxHash) return;
    navigator.clipboard.writeText(blockchainTxHash);
    setCopiedTx(true);
    setTimeout(() => setCopiedTx(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-lg w-full border border-purple-500/20 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-start p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-green-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Upload Successful!</h2>
              <p className="text-sm text-gray-400 mt-0.5">Your dataset is ready</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-700 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <p className="text-gray-300 mb-6">{message}</p>

          {/* Dataset Hash Section */}
          {datasetHash && (
            <div className="bg-gray-900/50 rounded-lg p-4 mb-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-gray-300">Dataset Hash</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-purple-300 bg-gray-950/50 px-3 py-2 rounded font-mono break-all">
                  {datasetHash}
                </code>
                <button
                  onClick={copyHash}
                  className="p-2 hover:bg-gray-700 rounded transition-colors shrink-0"
                  title="Copy hash"
                >
                  {copiedHash ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Blockchain Proof Section */}
          {blockchainTxHash && blockchainExplorerUrl && (
            <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg p-4 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-semibold text-white">Blockchain Proof Registered</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                Your dataset has been registered on Solana blockchain for immutable proof of ownership.
              </p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Transaction Hash</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs text-purple-300 bg-gray-950/50 px-3 py-2 rounded font-mono break-all">
                      {blockchainTxHash}
                    </code>
                    <button
                      onClick={copyTx}
                      className="p-2 hover:bg-gray-700 rounded transition-colors shrink-0"
                      title="Copy transaction hash"
                    >
                      {copiedTx ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                <a
                  href={blockchainExplorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on Solana Explorer
                </a>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
            {datasetId && (
              <a
                href={`/dashboard/dataset/${datasetId}`}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors text-center"
              >
                View Dataset
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
