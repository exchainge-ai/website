// TODO: Show user purchase history
// TODO: Display owned licenses in dashboard
// TODO: Add license expiry warnings

"use client";

import { X, Wallet, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

interface PurchaseLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: {
    id: string;
    title: string;
    price: string;
    blobId?: string;
  };
}

export function PurchaseLicenseModal({
  isOpen,
  onClose,
  dataset,
}: PurchaseLicenseModalProps) {
  const { authenticated, user } = usePrivy();
  const [purchasing, setPurchasing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txDigest, setTxDigest] = useState<string | null>(null);
  const [buyerAddress, setBuyerAddress] = useState<string | null>(null);

  const priceInSUI = parseFloat(dataset.price.replace(/[^0-9.]/g, "")) || 0.1;

  const handlePurchase = async () => {
    if (!authenticated || !user) {
      setError("Please sign in first");
      return;
    }

    setPurchasing(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";
      const response = await fetch(`${apiUrl}/licenses/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datasetId: dataset.id,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Purchase failed");
      }

      const result = await response.json();
      setTxDigest(result.txDigest);
      setBuyerAddress(result.buyerAddress);
      setSuccess(true);
    } catch (err) {
      console.error("Purchase failed:", err);
      setError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setPurchasing(false);
    }
  };

  if (!isOpen) return null;

  const SUI_NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet";
  const explorerUrl = txDigest ? `https://suiscan.xyz/${SUI_NETWORK}/tx/${txDigest}` : null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#121417] rounded-xl max-w-[500px] w-full shadow-2xl border border-gray-800 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-800 transition-colors">
          <X className="w-5 h-5 text-gray-400" />
        </button>

        <div className="text-center px-8 pt-8 pb-5">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/10 rounded-full mb-4">
            {success ? <CheckCircle className="w-9 h-9 text-green-500" /> : <Wallet className="w-9 h-9 text-blue-500" />}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {success ? "Purchase Successful!" : "Purchase License"}
          </h2>
          <p className="text-sm text-gray-400">{success ? "License NFT minted" : "Get dataset access"}</p>
        </div>

        <div className="px-8 pb-6">
          {!success ? (
            <>
              <div className="bg-[#1A1C1F] rounded-md border border-gray-800 p-4 mb-4">
                <p className="text-gray-300 text-sm mb-3">{dataset.title}</p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                  <span className="text-gray-400 text-sm">Demo Price</span>
                  <span className="text-2xl font-bold text-blue-400">{priceInSUI} SUI</span>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-md p-3 mb-4">
                <p className="text-blue-400 text-sm">Hackathon demo: Platform sponsors transaction</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-md p-3 mb-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handlePurchase}
                disabled={!authenticated || purchasing}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
              >
                {purchasing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5" />
                    {authenticated ? "Get License" : "Sign In First"}
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <div className="bg-[#1A1C1F] rounded-md border border-green-500/30 p-6 mb-4 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                <p className="text-gray-300 mb-2">License NFT minted</p>
                {buyerAddress && (
                  <p className="text-gray-500 text-xs mb-3 font-mono">
                    {buyerAddress.slice(0, 10)}...{buyerAddress.slice(-8)}
                  </p>
                )}
                {explorerUrl && (
                  <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm hover:underline">
                    View on SuiScan →
                  </a>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-full bg-brand-green hover:bg-brand-green-strong text-white font-semibold py-3 rounded-lg"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
