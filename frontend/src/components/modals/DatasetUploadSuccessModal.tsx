"use client";

import { CheckCircle, X, Copy, ExternalLink, Clock, Database, Hash, Loader2, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { apiFetch } from "@/lib/api/client";

interface DatasetUploadSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  datasetId: string | null;
  datasetHash: string | null;
  blockchainTxHash?: string | null;
  blockchainExplorerUrl?: string | null;
  blockchainNetwork?: 'mainnet-beta' | 'devnet' | 'testnet';
  blockchainTimestamp?: string | null;
}

export function DatasetUploadSuccessModal({
  isOpen,
  onClose,
  datasetId,
  datasetHash,
  blockchainTxHash: initialBlockchainTxHash,
  blockchainExplorerUrl: initialBlockchainExplorerUrl,
  blockchainNetwork = 'mainnet-beta',
  blockchainTimestamp: initialBlockchainTimestamp,
}: DatasetUploadSuccessModalProps) {
  const { getAccessToken, user } = usePrivy();
  const [copiedHash, setCopiedHash] = useState(false);
  const [blockchainTxHash, setBlockchainTxHash] = useState<string | null>(initialBlockchainTxHash ?? null);
  const [blockchainExplorerUrl, setBlockchainExplorerUrl] = useState<string | null>(initialBlockchainExplorerUrl ?? null);
  const [blockchainTimestamp, setBlockchainTimestamp] = useState<string | null>(initialBlockchainTimestamp ?? null);
  const [isPolling, setIsPolling] = useState(false);

  const networkDisplayName = blockchainNetwork === 'mainnet-beta' ? 'Mainnet' : blockchainNetwork.charAt(0).toUpperCase() + blockchainNetwork.slice(1);

  // Format timestamp nicely
  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
  };

  // Polling for blockchain confirmation
  useEffect(() => {
    if (!isOpen || !datasetId || blockchainTxHash) return;

    setIsPolling(true);
    let pollCount = 0;
    const maxPolls = 20;

    const pollInterval = setInterval(async () => {
      pollCount++;
      try {
        const token = await getAccessToken();
        const response = await apiFetch<{ data?: { blockchainTxHash?: string; blockchainExplorerUrl?: string; blockchainTimestamp?: string } }>(`/datasets/${datasetId}`, { token: token || undefined });

        if (response?.data?.blockchainTxHash) {
          setBlockchainTxHash(response.data.blockchainTxHash);
          setBlockchainExplorerUrl(response.data.blockchainExplorerUrl || null);
          setBlockchainTimestamp(response.data.blockchainTimestamp || null);
          setIsPolling(false);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }

      if (pollCount >= maxPolls) {
        setIsPolling(false);
        clearInterval(pollInterval);
      }
    }, 6000);

    return () => {
      clearInterval(pollInterval);
      setIsPolling(false);
    };
  }, [isOpen, datasetId, blockchainTxHash, getAccessToken]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const saveReceipt = () => {
    const receiptText = `
ExchAInge Upload Receipt
========================

Dataset ID: ${datasetId || 'N/A'}
Hash: ${datasetHash || 'N/A'}
Transaction: ${blockchainTxHash || 'Processing...'}
Network: Solana ${networkDisplayName}
Timestamp: ${formatTimestamp(blockchainTimestamp)}
Explorer: ${blockchainExplorerUrl || 'Pending'}

Uploaded by: ${user?.email?.address || user?.wallet?.address || 'User'}
    `.trim();

    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exchainge-receipt-${datasetId?.slice(0, 8) || 'dataset'}.txt`;
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
          <p className="text-sm text-gray-400">Your dataset is now registered on Solana.</p>
        </div>

        {/* Receipt Section */}
        <div className="px-8 pb-6">
          <div className="bg-[#1A1C1F] rounded-md border border-gray-800 overflow-hidden">

            {/* Receipt Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-brand-green/5 to-transparent border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Upload Receipt</h3>
              {blockchainTxHash ? (
                <div className="flex items-center gap-1.5 text-xs text-brand-green">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Registered on-chain</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Finalizing on chain...</span>
                </div>
              )}
            </div>

            {/* Receipt Body */}
            <div className="p-4 space-y-3 text-sm">

              {/* Upload Time */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>Upload Time</span>
                </div>
                <span className="text-gray-200 font-mono text-xs">{formatTimestamp(blockchainTimestamp)}</span>
              </div>

              {/* Dataset Hash */}
              {datasetHash && (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 text-gray-400 shrink-0">
                    <Hash className="w-4 h-4" />
                    <span>Hash</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-gray-300 font-mono text-xs truncate max-w-[200px]" title={datasetHash}>
                      {datasetHash.slice(0, 16)}...{datasetHash.slice(-8)}
                    </code>
                    <button
                      onClick={() => copyToClipboard(datasetHash)}
                      className="p-1 hover:bg-gray-800 rounded transition-colors"
                      title="Copy hash"
                    >
                      {copiedHash ? (
                        <CheckCircle className="w-3.5 h-3.5 text-brand-green" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Blockchain TX */}
              {blockchainTxHash && blockchainExplorerUrl && (
                <div className="pt-2 border-t border-gray-800">
                  <a
                    href={blockchainExplorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-md hover:bg-gray-800/50 transition-colors group"
                  >
                    <div className="flex items-center gap-2 text-gray-400">
                      <Database className="w-4 h-4" />
                      <span>View on Solana Explorer</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-brand-green transition-colors" />
                  </a>
                </div>
              )}

              {/* Uploaded By */}
              <div className="flex items-start justify-between text-xs">
                <span className="text-gray-500">Uploaded by</span>
                <span className="text-gray-400 font-mono">
                  {user?.email?.address || (user?.wallet?.address ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}` : 'User')}
                </span>
              </div>
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
            href={`/marketplace?highlight=${datasetId}`}
            onClick={onClose}
            className="w-full text-center text-gray-400 hover:text-white py-2 text-sm transition-colors flex items-center justify-center gap-1"
          >
            View Your Dataset
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
