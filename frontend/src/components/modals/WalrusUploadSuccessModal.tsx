"use client";

import { CheckCircle, X, Copy, ExternalLink, Clock, Database, Hash, Package } from "lucide-react";
import { useState } from "react";

interface WalrusUploadSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  blobId: string;
  txDigest?: string;
  datasetId?: string;
  title: string;
  filename: string;
  size: number;
}

export function WalrusUploadSuccessModal({
  isOpen,
  onClose,
  blobId,
  txDigest,
  datasetId,
  title,
  filename,
  size,
}: WalrusUploadSuccessModalProps) {
  const [copiedTxHash, setCopiedTxHash] = useState(false);

  const SUI_NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet";
  const WALRUS_NETWORK = process.env.NEXT_PUBLIC_WALRUS_NETWORK || "testnet";
  const SUI_PACKAGE_ID =
    process.env.NEXT_PUBLIC_SUI_PACKAGE_ID ||
    "0x7b79e60b89146533b040ee32ac8e6f6bbcda92169ce1bb70882e59de0062f0cb";

  const explorerUrl = txDigest
    ? `https://suiscan.xyz/${SUI_NETWORK}/tx/${txDigest}`
    : null;

  const walruscanUrl = `https://walruscan.com/${WALRUS_NETWORK}/blob/${blobId}`;
  const contractUrl = `https://suiscan.xyz/${SUI_NETWORK}/object/${SUI_PACKAGE_ID}`;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatTimestamp = () => {
    return new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTxHash(true);
    setTimeout(() => setCopiedTxHash(false), 2000);
  };

  const saveReceipt = () => {
    const receiptText = `
ExchAInge Walrus Upload Receipt
================================

Dataset: ${title}
File: ${filename}
Size: ${formatBytes(size)}
Blob ID: ${blobId}
Transaction: ${txDigest || "Demo Mode - No blockchain transaction"}
Network: Sui ${SUI_NETWORK.charAt(0).toUpperCase() + SUI_NETWORK.slice(1)}
Timestamp: ${formatTimestamp()}
${explorerUrl ? `Explorer: ${explorerUrl}` : ""}

Uploaded via Walrus Decentralized Storage
    `.trim();

    const blob = new Blob([receiptText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `walrus-receipt-${datasetId || blobId.slice(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-[#121417] rounded-xl max-w-[600px] w-full shadow-2xl border border-gray-800 relative animate-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Header */}
        <div className="text-center px-8 pt-8 pb-5">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-green/10 rounded-full mb-4">
            <CheckCircle className="w-9 h-9 text-brand-green" strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Upload Successful!</h2>
          <p className="text-sm text-gray-400">
            Your dataset is stored on Walrus and registered on Sui blockchain.
          </p>
        </div>

        {/* Receipt Section */}
        <div className="px-8 pb-6">
          <div className="bg-[#1A1C1F] rounded-md border border-gray-800 overflow-hidden">
            {/* Receipt Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-blue-500/5 to-transparent border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Upload Receipt</h3>
              <div className="flex items-center gap-1.5 text-xs text-blue-400">
                <Package className="w-3.5 h-3.5" />
                <span>Stored on Walrus</span>
              </div>
            </div>

            {/* Receipt Body */}
            <div className="p-4 space-y-3 text-sm">
              {/* Dataset Info */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-gray-400">
                  <Database className="w-4 h-4" />
                  <span>Dataset</span>
                </div>
                <div className="text-right">
                  <p className="text-gray-200 font-medium">{title}</p>
                  <p className="text-xs text-gray-500">{filename}</p>
                </div>
              </div>

              {/* Upload Time */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>Upload Time</span>
                </div>
                <span className="text-gray-200 font-mono text-xs">
                  {formatTimestamp()}
                </span>
              </div>

              {/* File Size */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-gray-400">
                  <Package className="w-4 h-4" />
                  <span>Size</span>
                </div>
                <span className="text-gray-200 font-mono text-xs">
                  {formatBytes(size)}
                </span>
              </div>

              {/* Blob ID */}
              <div className="pt-2 border-t border-gray-800">
                <a
                  href={walruscanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-md hover:bg-gray-800/50 transition-colors group"
                >
                  <div className="flex items-center gap-2 text-gray-400">
                    <Hash className="w-4 h-4" />
                    <span>View on Walrus Explorer</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                </a>
              </div>

              {/* Blockchain TX */}
              {txDigest && explorerUrl && (
                <div className="pt-2 border-t border-gray-800">
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-md hover:bg-gray-800/50 transition-colors group"
                  >
                    <div className="flex items-center gap-2 text-gray-400">
                      <Database className="w-4 h-4" />
                      <span>View Transaction on Sui</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                  </a>
                </div>
              )}

              {/* Smart Contract */}
              <div className="pt-2 border-t border-gray-800">
                <a
                  href={contractUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-md hover:bg-gray-800/50 transition-colors group"
                >
                  <div className="flex items-center gap-2 text-gray-400">
                    <Database className="w-4 h-4" />
                    <span>View Smart Contract</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                </a>
              </div>

              {!txDigest && (
                <div className="pt-2 border-t border-gray-800">
                  <div className="flex items-center gap-2 text-xs text-gray-500 p-2">
                    <Database className="w-4 h-4" />
                    <span>Demo Mode - Blockchain registration simulated</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-8 pb-6 flex flex-col gap-2">
          <button
            onClick={saveReceipt}
            className="w-full bg-brand-green hover:bg-brand-green-strong text-primary-foreground font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Save Receipt
          </button>
          <a
            href="/marketplace"
            onClick={onClose}
            className="w-full text-center text-gray-400 hover:text-white py-2 text-sm transition-colors"
          >
            View Marketplace
          </a>
        </div>
      </div>
    </div>
  );
}
