"use client";

/**
 * Dataset Upload Page
 *
 * Allows users to:
 * - Upload dataset files to Walrus
 * - Register datasets onchain
 * - Set metadata (title, description, price)
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export default function UploadPage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [priceUsd, setPriceUsd] = useState("0");
  const [licenseType, setLicenseType] = useState("view_only");

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [error, setError] = useState("");

  // Handle file selection
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
    }
  }

  // Handle file drop
  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError("");
    }
  }

  // Upload and register dataset
  async function handleUpload() {
    if (!file || !title || !description) {
      setError("Please fill in all required fields");
      return;
    }

    setUploading(true);
    setError("");
    setUploadProgress("Uploading to Walrus...");

    try {
      // Step 1: Upload to Walrus
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("description", description);

      const uploadRes = await fetch(`${API_BASE_URL}/upload-to-walrus`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const uploadData = await uploadRes.json();
      console.log("Walrus upload complete:", uploadData);

      setUploadProgress("Registering onchain...");

      // Step 2: Register onchain
      const registerRes = await fetch(`${API_BASE_URL}/datasets/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blobId: uploadData.blobId,
          title,
          description,
          filename: file.name,
          size: file.size,
          category,
          priceUsd: parseFloat(priceUsd),
          licenseType,
        }),
      });

      if (!registerRes.ok) {
        const errorData = await registerRes.json();
        throw new Error(errorData.error || "Registration failed");
      }

      const registerData = await registerRes.json();
      console.log("Dataset registered:", registerData);

      setUploadProgress("Success! Redirecting...");

      // Wait a moment then redirect to marketplace
      setTimeout(() => {
        router.push("/marketplace");
      }, 1500);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
      setUploadProgress("");
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-4xl font-bold mb-2">Upload Dataset</h1>
      <p className="text-gray-600 mb-8">
        Upload your physical AI dataset to Walrus and license it onchain
      </p>

      {/* File Upload Area */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-12 mb-6 text-center hover:border-gray-400 transition-colors"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {file ? (
          <div>
            <p className="text-lg font-medium">{file.name}</p>
            <p className="text-sm text-gray-600">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <button
              onClick={() => setFile(null)}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              Change file
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-4 text-gray-600">
              Drag and drop your dataset file here, or click to browse
            </p>
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              id="file-input"
              accept=".zip,.tar.gz,.csv,.json,.h5,.bag"
            />
            <label
              htmlFor="file-input"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700"
            >
              Choose File
            </label>
          </div>
        )}
      </div>

      {/* Metadata Form */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Drone Flight Data - Urban Environment"
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your dataset, collection method, and use cases..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="drone">Drone</option>
              <option value="robotics">Robotics</option>
              <option value="autonomous_vehicles">Autonomous Vehicles</option>
              <option value="sensor_data">Sensor Data</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Price (USD)
            </label>
            <input
              type="number"
              value={priceUsd}
              onChange={(e) => setPriceUsd(e.target.value)}
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            License Type
          </label>
          <select
            value={licenseType}
            onChange={(e) => setLicenseType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="view_only">View Only</option>
            <option value="view_only_shared">View Only (Shared)</option>
            <option value="shared_ownership">Shared Ownership</option>
            <option value="exclusive">Exclusive</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {/* Progress Message */}
      {uploadProgress && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded text-blue-700">
          {uploadProgress}
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={uploading || !file || !title || !description}
        className={`w-full py-3 rounded font-medium ${
          uploading || !file || !title || !description
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        {uploading ? uploadProgress : "Upload & Register Dataset"}
      </button>

      <p className="mt-4 text-sm text-gray-600 text-center">
        Your dataset will be stored on Walrus (decentralized storage) and
        registered onchain via Sui Move contract.
      </p>
    </div>
  );
}
