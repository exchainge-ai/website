"use client";

/**
 * License Page
 *
 * Allows users to:
 * - Connect Sui wallet
 * - View uploaded datasets
 * - Mint onchain licenses for datasets
 * - View their existing licenses
 */

import { useState, useEffect } from "react";
import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

// Configuration
const PACKAGE_ID = process.env.NEXT_PUBLIC_SUI_PACKAGE_ID;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
const CLOCK_OBJECT_ID = "0x6";

// Types
interface Dataset {
  id: string;
  title: string;
  description: string;
  storage_key: string; // Use as CID
  price_usdc: number;
}

interface License {
  id: string;
  license_id: string;
  dataset_cid: string;
  license_type: string;
  issued_at: number;
  expires_at: number | null;
  is_revoked: boolean;
}

export default function LicensePage() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState<string | null>(null);

  // Fetch user's datasets
  useEffect(() => {
    async function fetchDatasets() {
      try {
        const res = await fetch(`${API_BASE_URL}/datasets`);
        const data = await res.json();
        setDatasets(data.data || []);
      } catch (error) {
        console.error("Failed to fetch datasets:", error);
      }
    }
    fetchDatasets();
  }, []);

  // Fetch user's licenses when wallet connects
  useEffect(() => {
    async function fetchLicenses() {
      if (!account?.address) return;

      try {
        const res = await fetch(
          `${API_BASE_URL}/licenses?address=${account.address}&active_only=true`
        );
        const data = await res.json();
        setLicenses(data.data || []);
      } catch (error) {
        console.error("Failed to fetch licenses:", error);
      }
    }
    fetchLicenses();
  }, [account?.address]);

  // Mint a license for a dataset
  async function mintLicense(dataset: Dataset) {
    if (!account?.address) {
      alert("Please connect wallet first");
      return;
    }

    if (!PACKAGE_ID) {
      alert("Contract not deployed. Set NEXT_PUBLIC_SUI_PACKAGE_ID");
      return;
    }

    setMinting(dataset.id);

    try {
      // Build transaction
      const tx = new Transaction();

      // Convert arguments to bytes
      const cidBytes = Array.from(
        new TextEncoder().encode(dataset.storage_key)
      );
      const typeBytes = Array.from(new TextEncoder().encode("commercial"));

      // Call issue_license function
      tx.moveCall({
        target: `${PACKAGE_ID}::license::issue_license`,
        arguments: [
          tx.pure.vector("u8", cidBytes), // dataset_cid
          tx.pure.address(account.address), // licensee
          tx.pure.vector("u8", typeBytes), // license_type
          tx.pure.u64(0), // expiry_duration_ms (0 = never)
          tx.object(CLOCK_OBJECT_ID), // clock
        ],
      });

      // Execute transaction
      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: async (result) => {
            console.log("License minted:", result);
            alert("License minted successfully!");

            // Trigger sync
            await fetch(`${API_BASE_URL}/licenses/sync`, {
              method: "POST",
            });

            // Refresh licenses
            setTimeout(async () => {
              const res = await fetch(
                `${API_BASE_URL}/licenses?address=${account.address}&active_only=true`
              );
              const data = await res.json();
              setLicenses(data.data || []);
            }, 2000);

            setMinting(null);
          },
          onError: (error) => {
            console.error("Failed to mint license:", error);
            alert("Failed to mint license. See console for details.");
            setMinting(null);
          },
        }
      );
    } catch (error) {
      console.error("Error minting license:", error);
      alert("Error building transaction");
      setMinting(null);
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Dataset Licenses</h1>
        <p className="text-gray-600">
          Mint onchain licenses for datasets using Sui blockchain
        </p>
      </div>

      {/* Wallet Connection */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Wallet</h2>
        <ConnectButton />
        {account && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Connected: {account.address.slice(0, 12)}...
              {account.address.slice(-8)}
            </p>
          </div>
        )}
      </div>

      {/* Available Datasets */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Available Datasets</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {datasets.map((dataset) => (
            <div key={dataset.id} className="p-6 bg-white rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">{dataset.title}</h3>
              <p className="text-gray-600 text-sm mb-4">
                {dataset.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">
                  ${dataset.price_usdc}
                </span>
                <button
                  onClick={() => mintLicense(dataset)}
                  disabled={minting === dataset.id || !account}
                  className={`px-4 py-2 rounded ${
                    minting === dataset.id || !account
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {minting === dataset.id ? "Minting..." : "Mint License"}
                </button>
              </div>
            </div>
          ))}
          {datasets.length === 0 && (
            <div className="col-span-2 text-center py-12 text-gray-500">
              No datasets available
            </div>
          )}
        </div>
      </div>

      {/* User's Licenses */}
      {account && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Licenses</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Dataset CID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Issued
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {licenses.map((license) => (
                  <tr key={license.id}>
                    <td className="px-6 py-4 text-sm font-mono">
                      {license.dataset_cid.slice(0, 16)}...
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {license.license_type}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(license.issued_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          license.is_revoked
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {license.is_revoked ? "Revoked" : "Active"}
                      </span>
                    </td>
                  </tr>
                ))}
                {licenses.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No licenses yet. Mint one above!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
