"use client";

/**
 * TODO: Future Enhancements for Dataset Upload:
 * 1. Implement chunked file uploads for large datasets
 * 2. Add resume capability for interrupted uploads
 * 3. Implement real progress tracking instead of simulations
 * 4. Add file type validation and preview generation
 * 5. Integrate with cloud storage (S3, Azure Blob, etc)
 * 6. Add AI-powered metadata extraction
 * 7. Implement proper schema validation for datasets
 * 8. Add collaborative dataset editing capabilities
 * 9. Implement dataset versioning
 */

import { usePrivy } from "@privy-io/react-auth";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  RefreshCw,
  Shield,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { DatasetUploadSuccessModal } from "@/components/modals/DatasetUploadSuccessModal";
import { TermsModal } from "@/components/modals/TermsModal";
import { DATASET_STATUS, type DatasetCategory } from "@/lib/types/dataset";
import { formatBytes } from "@/lib/mappers/dataset";
import { UPLOAD_LIMITS } from "@/lib/constants/storage";

type UploadStep =
  | "upload"
  | "extracting"
  | "preview"
  | "metadata"
  | "verifying"
  | "complete";

interface DatasetMetadata {
  title: string;
  description: string;
  category: string;
  tags: string[];
  price: string;
  format: string;
  size: string;
  userId?: string;
  autoPublish?: boolean;
  // Licensing fields
  licenseType?: string;
  canCommercialUse?: boolean;
  canResale?: boolean;
  attributionRequired?: boolean;
  // Attestations
  attestationCategory?: string;
  attestationSubcategory?: string;
  attestationLocation?: string;
}

const CATEGORY_LABEL_TO_SLUG: Record<string, DatasetCategory | undefined> = {
  Robotics: "robotics",
  "Autonomous Vehicles": "autonomous_vehicles",
  Navigation: "navigation",
  Manipulation: "manipulation",
  "Sensor Data": "sensor_data",
  "Motion Capture": "motion_capture",
  "Human-Robot Interaction": "human_robot_interaction",
  "Embodied AI": "embodied_ai",
  "Computer Vision": "other",
  Other: "other",
};

function normalizeCategory(label: string): DatasetCategory {
  return CATEGORY_LABEL_TO_SLUG[label] ?? "other";
}

function parseSizeToBytes(size: string): number {
  if (!size) return 0;
  const match = size.match(/([\d.]+)\s*(B|KB|MB|GB|TB)/i);
  if (!match) return 0;

  const value = Number(match[1]);
  const unit = match[2].toUpperCase();
  const multipliers: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 ** 2,
    GB: 1024 ** 3,
    TB: 1024 ** 4,
  };

  const multiplier = multipliers[unit] ?? 1;
  return Math.round(value * multiplier);
}

export function UploadContent() {
  const router = useRouter();
  const { user, getAccessToken } = usePrivy();
  const [step, setStep] = useState<UploadStep>("upload");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedSample, setExtractedSample] = useState<string | null>(null);
  const [verificationScore, setVerificationScore] = useState<number>(0);
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [customSample, setCustomSample] = useState<File | null>(null);
  const [showCustomUpload, setShowCustomUpload] = useState<boolean>(false);
  const [metadata, setMetadata] = useState<DatasetMetadata>({
    title: "",
    description: "",
    category: "Robotics",
    tags: [],
    price: "",
    format: "",
    size: "",
    autoPublish: true,
    // Default licensing
    licenseType: "royalty-free",
    canCommercialUse: true,
    canResale: false,
    attributionRequired: true,
    // Default attestations (empty)
    attestationCategory: "",
    attestationSubcategory: "",
    attestationLocation: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [datasetHash, setDatasetHash] = useState<string | null>(null);
  const [blockchainTxHash, setBlockchainTxHash] = useState<string | null>(null);
  const [blockchainExplorerUrl, setBlockchainExplorerUrl] = useState<string | null>(null);
  const [createdDatasetId, setCreatedDatasetId] = useState<string | null>(null);
  const [uploadedFileKey, setUploadedFileKey] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [backgroundSession, setBackgroundSession] = useState<{
    id: string;
    uploadUrl: string;
    key: string;
    publicUrl: string;
    expiresAt: string;
  } | null>(null);
  const [isBackgroundUploading, setIsBackgroundUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'pending' | 'completed' | 'failed'>('idle');

  const bucketEnsuredRef = useRef(false);
  const lastProgressSentRef = useRef<number>(0);

  // Form validation for metadata entry
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    description?: string;
    price?: string;
    terms?: string;
  }>({});

  // Update metadata with user ID when user is available
  useEffect(() => {
    if (!user) return;

    setMetadata((prev) => ({
      ...prev,
      userId: user.id,
    }));

    const syncUser = async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          throw new Error("Missing access token");
        }

        await fetch("/api/users/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: user.email?.address,
            displayName: user.email?.address ?? user.wallet?.address ?? undefined,
            walletAddress: user.wallet?.address,
            accountType: "individual",
          }),
        });
      } catch (error) {
        console.error("[Upload] Failed to sync user", error);
      }
    };

    void syncUser();
  }, [user]);

  const ensureBucket = useCallback(async () => {
    if (bucketEnsuredRef.current) return;
    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error("Missing access token");
      }

      await fetch("/api/storage/ensure", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bucket: "datasets" }),
      });
      bucketEnsuredRef.current = true;
    } catch (error) {
      console.error("[Upload] Failed to ensure bucket", error);
    }
  }, [getAccessToken]);

  useEffect(() => {
    void ensureBucket();
  }, [ensureBucket]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) {
        return;
      }

      const file = acceptedFiles[0];
      const MAX_FILE_SIZE = UPLOAD_LIMITS.MAX_FILE_SIZE;
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(
          `File size (${formatBytes(file.size)}) exceeds the ${formatBytes(
            MAX_FILE_SIZE,
          )} limit. Please contact support for larger datasets.`,
        );
        return;
      }

      setUploadError(null);
      setUploadedFile(file);
      setBackgroundSession(null);
      setUploadedFileKey(null);
      setUploadedFileUrl(null);
      setDatasetHash(null);
      setUploadProgress(0);
      setVerificationScore(0);
      setVerificationStatus("pending");

      const inferredTitle = file.name
        .split(".")
        .slice(0, -1)
        .join(".")
        .replace(/[_-]+/g, " ");
      const extension = file.name.split(".").pop()?.toUpperCase() || "UNKNOWN";

      setMetadata((prev) => ({
        ...prev,
        title: inferredTitle || prev.title,
        format: extension,
        size: formatBytes(file.size),
        userId: user?.id || prev.userId,
      }));

      setStep("extracting");

      const previewUrl = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : "https://api.dicebear.com/7.x/shapes/svg?seed=file";

      setExtractedSample(previewUrl);
      setAiAnalysis(
        `File "${file.name}" is ready. Fill in the details and publish to start a background upload.`,
      );
      setShowCustomUpload(false);
      setCustomSample(null);

      setTimeout(() => {
        setStep("preview");
      }, 500);
    },
    [user],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/zip": [".zip"],
      "application/x-tar": [".tar"],
      "application/gzip": [".gz"],
      "application/x-compressed": [".rar"],
      "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
    },
    maxFiles: 1,
  });

  const handleAcceptSample = () => {
    // Always go to metadata entry step after preview
    setStep("metadata");
  };

  const validateMetadata = () => {
    const errors: {
      title?: string;
      description?: string;
      price?: string;
      terms?: string;
    } = {};
    let isValid = true;

    if (!metadata.title || metadata.title.trim() === "") {
      errors.title = "Title is required";
      isValid = false;
    }

    if (!metadata.description || metadata.description.trim() === "") {
      errors.description = "Description is required";
      isValid = false;
    } else if (metadata.description.length < 10) {
      errors.description = "Description must be at least 10 characters";
      isValid = false;
    }

    if (!metadata.price) {
      errors.price = "Price is required";
      isValid = false;
    } else if (isNaN(Number(metadata.price)) || Number(metadata.price) < 0) {
      errors.price = "Price must be a valid positive number";
      isValid = false;
    }

    if (!acceptedTerms) {
      errors.terms = "You must accept the terms and conditions";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleStartVerification = () => {
    // Validate all required metadata before proceeding
    if (!validateMetadata()) {
      return;
    }

    setStep("verifying");

    // Simulate AI verification with progressive scoring
    let score = 0;
    const interval = setInterval(() => {
      score += Math.floor(Math.random() * 10) + 5;
      if (score >= 85) {
        score = 85 + Math.floor(Math.random() * 10);
        setVerificationScore(score);
        clearInterval(interval);
        setTimeout(() => {
          setStep("complete");
        }, 1000);
      } else {
        setVerificationScore(score);
      }
    }, 300);
  };

  const handleRejectSample = () => {
    setShowCustomUpload(true);
  };

  const onCustomSampleDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setCustomSample(file);
      // Create preview URL for the custom sample
      const previewUrl = URL.createObjectURL(file);
      setExtractedSample(previewUrl);
      setShowCustomUpload(false);
      setAiAnalysis(
        `Custom preview image "${file.name}" uploaded. This will be shown to potential buyers as a preview of your dataset.`,
      );
    }
  }, []);

  const customSampleDropzone = useDropzone({
    onDrop: onCustomSampleDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/gif": [".gif"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
  });

  const startBackgroundUpload = useCallback(
    async (
      session: {
        id: string;
        uploadUrl: string;
        key: string;
        publicUrl: string;
      },
      file: File,
    ) => {
      setIsBackgroundUploading(true);
      setUploadProgress(0);
      lastProgressSentRef.current = 0;

      let authToken = await getAccessToken();

      const ensureToken = async () => {
        if (authToken) {
          return authToken;
        }
        authToken = await getAccessToken();
        return authToken;
      };

      const sendUpdate = async (
        status: "pending" | "in_progress" | "complete" | "failed" | "cancelled",
        progress?: number,
        errorMessage?: string,
      ) => {
        try {
          let tokenToUse = await ensureToken();
          if (!tokenToUse) {
            throw new Error("Missing access token");
          }

          const payload = JSON.stringify({
            sessionId: session.id,
            status,
            progress,
            errorMessage,
          });

          const response = await fetch("/api/upload/background", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokenToUse}`,
            },
            body: payload,
          });

          if (response.status === 401) {
            authToken = await getAccessToken();
            tokenToUse = authToken;

            if (!tokenToUse) {
              throw new Error("Missing access token");
            }

            await fetch("/api/upload/background", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${tokenToUse}`,
              },
              body: payload,
            });
          }
        } catch (err) {
          console.error("[Upload] Failed to report background progress:", err);
        }
      };

      try {
        await sendUpdate("in_progress", 0);

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (event) => {
            if (!event.lengthComputable) return;
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);

            const shouldReport =
              percent === 100 ||
              percent - lastProgressSentRef.current >= 5 ||
              percent % 25 === 0;

            if (shouldReport) {
              lastProgressSentRef.current = percent;
              void sendUpdate("in_progress", percent);
            }
          });

          xhr.addEventListener("load", async () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              setUploadProgress(100);
              lastProgressSentRef.current = 100;
              await sendUpdate("complete", 100);
              setUploadedFileKey(session.key);
              setUploadedFileUrl(session.publicUrl);
              resolve();
            } else {
              const errorMessage = `Upload failed with status ${xhr.status}`;
              await sendUpdate(
                "failed",
                lastProgressSentRef.current,
                errorMessage,
              );
              reject(new Error(errorMessage));
            }
          });

          xhr.addEventListener("error", async () => {
            const errorMessage = "Network error during upload";
            await sendUpdate(
              "failed",
              lastProgressSentRef.current,
              errorMessage,
            );
            reject(new Error(errorMessage));
          });

          xhr.open("PUT", session.uploadUrl);
          xhr.setRequestHeader(
            "Content-Type",
            file.type || "application/octet-stream",
          );
          xhr.send(file);
        });
      } catch (error) {
        console.error("[Upload] Background upload failed:", error);
        setUploadError(
          error instanceof Error
            ? error.message
            : "Background upload failed. Please retry from the dataset page.",
        );
      } finally {
        setIsBackgroundUploading(false);
      }
    },
    [
      setUploadProgress,
      setUploadedFileKey,
      setUploadedFileUrl,
      setUploadError,
      setIsBackgroundUploading,
      getAccessToken,
    ],
  );

  const toggleAutoPublish = () => {
    setMetadata((prev) => ({
      ...prev,
      autoPublish: !prev.autoPublish,
    }));
  };

  const handleComplete = async () => {
    if (!validateMetadata()) return;

    const ownerId = metadata.userId || user?.id;
    if (!ownerId) {
      setSuccessMessage(
        "You must be signed in to upload a dataset. Please log in and try again.",
      );
      setShowSuccessModal(true);
      return;
    }

    if (!uploadedFile) {
      setSuccessMessage("Please upload a dataset file before continuing.");
      setShowSuccessModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("[Upload] Finalizing dataset creation...");

      const token = await getAccessToken();
      if (!token) {
        throw new Error("Missing access token");
      }

      let previewUrl: string | null = null;

      if (customSample) {
        // Upload custom sample via API endpoint
        const sampleFormData = new FormData();
        sampleFormData.append("file", customSample);
        sampleFormData.append("filename", customSample.name);
        sampleFormData.append("folder", "previews");

        const sampleResponse = await fetch("/api/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: sampleFormData,
        });

        if (sampleResponse.ok) {
          const sampleResult = await sampleResponse.json();
          previewUrl = sampleResult.data.publicUrl;
        }
      }

      if (!previewUrl && uploadedFile.type.startsWith("image/")) {
        previewUrl = uploadedFileUrl;
      }

      const autoPublishThreshold = 85;
      const statusToUse =
        metadata.autoPublish && verificationScore >= autoPublishThreshold
          ? DATASET_STATUS.LIVE
          : DATASET_STATUS.PENDING;

      const sizeBytes = uploadedFile.size ?? parseSizeToBytes(metadata.size);
      const formattedSize = metadata.size || formatBytes(sizeBytes);
      const categorySlug = normalizeCategory(metadata.category);

      // Build attestations array
      const attestations: string[] = [];
      if (metadata.attestationCategory) {
        if (metadata.attestationSubcategory) {
          attestations.push(`${metadata.attestationCategory}/${metadata.attestationSubcategory}`);
        } else {
          attestations.push(metadata.attestationCategory);
        }
      }
      if (metadata.attestationLocation) {
        attestations.push(`location:${metadata.attestationLocation}`);
      }
      attestations.push("verified-by:user"); // User-provided attestation

      // Build semantic tags object
      const semanticTags: Record<string, string> = {};
      if (metadata.attestationCategory) {
        semanticTags.type = metadata.attestationCategory;
      }
      if (metadata.attestationLocation) {
        semanticTags.location = metadata.attestationLocation;
      }

      const requestBody = {
        // Server will use authenticated user's ID, no need to send it
        title: metadata.title || "Untitled Dataset",
        description: metadata.description || "No description provided",
        category: categorySlug,
        priceUsd: metadata.price || "0",
        fileFormat: metadata.format || uploadedFile.type || "UNKNOWN",
        sizeBytes,
        sizeFormatted: formattedSize,
        tags: metadata.tags,
        thumbnailUrl: previewUrl,
        autoPublish: metadata.autoPublish ?? true,
        verificationScore,
        status: statusToUse,
        storageProvider: "r2",
        backgroundUpload: true,
        originalFilename: uploadedFile.name,
        contentType: uploadedFile.type || "application/octet-stream",
        isMarketplaceOnly: false,
        // Licensing fields
        licenseType: metadata.licenseType || "royalty-free",
        canCommercialUse: metadata.canCommercialUse ?? true,
        canResale: metadata.canResale ?? false,
        attributionRequired: metadata.attributionRequired ?? true,
        // Attestations
        attestations: attestations.length > 0 ? attestations : undefined,
        semanticTags: Object.keys(semanticTags).length > 0 ? semanticTags : undefined,
      };

      const response = await fetch("/api/datasets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Request failed with status ${response.status}`);
      }

      const payload = await response.json();
      const datasetId: string | undefined = payload?.data?.id;
      const sessionInfo = payload?.uploadSession ?? null;

      console.log('[DEBUG] API Response:', {
        datasetId,
        datasetHash: payload?.data?.datasetHash,
        blockchainTxHash: payload?.data?.blockchainTxHash,
        blockchainExplorerUrl: payload?.data?.blockchainExplorerUrl,
      });

      // Store dataset ID for blockchain proof
      if (datasetId) {
        setCreatedDatasetId(datasetId);
      }
      setDatasetHash(payload?.data?.datasetHash ?? null);
      setBlockchainTxHash(payload?.data?.blockchainTxHash ?? null);
      setBlockchainExplorerUrl(payload?.data?.blockchainExplorerUrl ?? null);
      setBackgroundSession(sessionInfo);

      if (sessionInfo && uploadedFile) {
        void startBackgroundUpload(sessionInfo, uploadedFile);
      } else {
        setUploadProgress(100);
      }

      setUploadedFileKey(sessionInfo?.key ?? null);
      setUploadedFileUrl(sessionInfo?.publicUrl ?? null);

      const statusMessage =
        statusToUse === DATASET_STATUS.LIVE
          ? "Dataset published instantly. We'll finish uploading the file in the background and notify you when it's ready."
          : "Dataset saved. We'll finish uploading the file in the background and move it live when verification completes.";

      setSuccessMessage(statusMessage);
      setShowSuccessModal(true);

      console.log("Dataset uploaded successfully", datasetId);
    } catch (error) {
      console.error("Error creating dataset:", error);
      setSuccessMessage(
        "There was a problem uploading your dataset. Please try again.",
      );
      setShowSuccessModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Check if a comma or space was entered
    if (e.key === "," || e.key === " " || e.key === "Enter") {
      e.preventDefault();

      const input = e.currentTarget;
      const value = input.value.trim();

      if (value && !metadata.tags.includes(value)) {
        setMetadata((prev) => ({
          ...prev,
          tags: [...prev.tags, value.toLowerCase()],
        }));
      }

      input.value = "";
    }
  };

  const removeTag = (tagToRemove: string) => {
    setMetadata((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const pollVerificationStatus = async (jobId: string, token: string) => {
    const maxAttempts = 20; // Poll for up to 2 minutes (20 * 6s)
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        console.log("[Upload] Verification polling timeout");
        return;
      }

      attempts++;

      try {
        const response = await fetch(`/api/verification/${jobId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          const job = result.data;

          if (job.status === 'completed' && job.result) {
            // Update verification score when complete
            setVerificationScore(Math.round(job.result.qualityScore * 10) || 0);
            setVerificationStatus('completed');
            setAiAnalysis(prev =>
              prev.replace('AI verification in progress...', `AI verification complete! Quality score: ${job.result.qualityScore}/10`)
            );
            console.log("[Upload] Verification completed:", job.result);
            return;
          }

          if (job.status === 'failed') {
            setVerificationStatus('failed');
            console.error("[Upload] Verification failed:", job.error);
            return;
          }

          // Still processing, poll again
          setTimeout(poll, 6000); // Poll every 6 seconds
        }
      } catch (error) {
        console.error("[Upload] Failed to poll verification status:", error);
      }
    };

    // Start polling after a short delay
    setTimeout(poll, 2000);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              type="button"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold">Upload Dataset</h1>
              <p className="text-gray-400 mt-1">
                Share your data and earn from every use
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-12 max-w-3xl mx-auto">
            {[
              { key: "upload", label: "Upload" },
              { key: "preview", label: "Preview" },
              { key: "metadata", label: "Details" },
              { key: "verifying", label: "Verify" },
              { key: "complete", label: "Complete" },
            ].map((s, idx) => {
              const stepIndex = [
                "upload",
                "extracting",
                "preview",
                "metadata",
                "verifying",
                "complete",
              ].indexOf(step);
              const currentIndex = [
                "upload",
                "extracting",
                "preview",
                "metadata",
                "verifying",
                "complete",
              ].indexOf(s.key);
              const isActive = currentIndex <= stepIndex;

              return (
                <div
                  key={s.key}
                  className={`flex items-center ${idx === 4 ? "" : "flex-1"}`}
                >
                  <div
                    className={`flex flex-col items-center ${
                      idx === 4 ? "" : "flex-1"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isActive
                          ? "bg-purple-600 text-white"
                          : "bg-gray-700 text-gray-400"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span
                      className={`text-sm mt-2 ${
                        isActive ? "text-purple-400" : "text-gray-500"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {idx < 4 && (
                    <div
                      className={`h-1 flex-1 ${
                        isActive ? "bg-purple-600" : "bg-gray-700"
                      }`}
                    ></div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Upload Step */}
          {step === "upload" && (
            <div className="max-w-2xl mx-auto">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed ${
                  isDragActive
                    ? "border-purple-500 bg-purple-900/20"
                    : "border-gray-600"
                } rounded-xl p-12 text-center cursor-pointer hover:bg-gray-800/30 transition-colors`}
              >
                <input {...getInputProps()} />
                <Upload className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <h3 className="text-lg font-semibold mb-2">
                  Drop your dataset file here
                </h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  Upload your dataset in any common format (.zip, .tar, .gz,
                  .rar) or an image file. Supports files up to 1&nbsp;TB with
                  background uploading.
                </p>
                <button
                  type="button"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Browse Files
                </button>
              </div>
            </div>
          )}

          {/* Extracting Step */}
          {step === "extracting" && (
            <div className="max-w-2xl mx-auto text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-purple-500 rounded-full animate-spin"></div>
                <FileText className="absolute inset-0 m-auto w-10 h-10 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Preparing your dataset...
              </h3>
              <p className="text-gray-400 mb-6">
                We're reserving storage and getting things ready for a background
                upload. You can continue filling in the details.
              </p>

              {/* Upload Progress Bar */}
              {uploadProgress > 0 && (
                <div className="max-w-md mx-auto">
                  <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>Upload Progress</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300 ease-out rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  {uploadedFile && (
                    <p className="text-xs text-gray-500 mt-2">
                      {uploadedFile.name} ({formatBytes(uploadedFile.size)})
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Preview Step */}
          {step === "preview" && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-gray-800 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-semibold mb-4">Dataset Preview</h3>

                <div className="border border-gray-700 rounded-lg p-4 mb-6 bg-gray-900/50">
                  {/* Show preview image or fallback */}
                  <div className="flex justify-center mb-6">
                    {extractedSample ? (
                      <div className="relative bg-purple-900/20 p-6 rounded-lg border-2 border-purple-500/20">
                        <img
                          src={extractedSample}
                          alt="Dataset preview"
                          className="max-h-64 rounded-lg object-contain w-auto h-auto"
                          style={{ minWidth: "120px", minHeight: "120px" }}
                        />
                      </div>
                    ) : (
                      <div className="h-64 w-full bg-gray-700 rounded-lg flex items-center justify-center">
                        <p className="text-gray-400">No preview available</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-300">{aiAnalysis}</p>
                  </div>

                  {/* AI Verification Status */}
                  {verificationStatus === 'pending' && (
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-300">AI Verification in Progress</p>
                          <p className="text-xs text-blue-400/70 mt-1">Analyzing dataset quality and content...</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {verificationStatus === 'completed' && (
                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-300">AI Verification Complete</p>
                          <p className="text-xs text-green-400/70 mt-1">Quality Score: {verificationScore}/100</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {verificationStatus === 'failed' && (
                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-yellow-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-yellow-300">Verification Pending</p>
                          <p className="text-xs text-yellow-400/70 mt-1">File uploaded successfully. Manual review may be required.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {showCustomUpload ? (
                    <div>
                      <p className="text-sm text-gray-400 mb-4">
                        Upload a custom preview image:
                      </p>
                      <div
                        {...customSampleDropzone.getRootProps()}
                        className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-800/30 transition-colors"
                      >
                        <input {...customSampleDropzone.getInputProps()} />
                        <p className="text-sm text-gray-400">
                          Drop an image here or click to select
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={handleRejectSample}
                        className="text-gray-400 hover:text-gray-300 text-sm flex items-center gap-1"
                      >
                        <RefreshCw className="w-4 h-4" /> Use different preview
                      </button>
                      <button
                        type="button"
                        onClick={handleAcceptSample}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" /> Accept Preview
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Metadata Step */}
          {step === "metadata" && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-gray-800 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-semibold mb-6">Dataset Details</h3>
                <p className="text-sm text-gray-400 mb-6">
                  Everything you enter here becomes part of your public marketplace listing.
                  Buyers will see this content on the dataset cards, and it powers the search
                  filters and discovery matches on the Discovery board.
                </p>

                <form className="space-y-6">
                  <div>
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-gray-300 mb-1"
                    >
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={metadata.title}
                      onChange={(e) =>
                        setMetadata({ ...metadata, title: e.target.value })
                      }
                      className={`w-full bg-gray-700 border ${
                        formErrors.title ? "border-red-500" : "border-gray-600"
                      } rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                      placeholder="e.g. Industrial Robot Vision Dataset"
                      aria-describedby={
                        formErrors.title ? "title-error" : undefined
                      }
                      required
                    />
                    {formErrors.title && (
                      <p id="title-error" className="mt-1 text-xs text-red-400">
                        {formErrors.title}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-300 mb-1"
                    >
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="description"
                      value={metadata.description}
                      onChange={(e) =>
                        setMetadata({
                          ...metadata,
                          description: e.target.value,
                        })
                      }
                      rows={4}
                      className={`w-full bg-gray-700 border ${
                        formErrors.description
                          ? "border-red-500"
                          : "border-gray-600"
                      } rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                      placeholder="Describe your dataset in detail, including what it contains and how it can be used"
                      aria-describedby={
                        formErrors.description ? "description-error" : undefined
                      }
                      required
                    ></textarea>
                    {formErrors.description && (
                      <p
                        id="description-error"
                        className="mt-1 text-xs text-red-400"
                      >
                        {formErrors.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="category"
                      className="block text-sm font-medium text-gray-300 mb-1"
                    >
                      Category
                    </label>
                    <select
                      id="category"
                      value={metadata.category}
                      onChange={(e) =>
                        setMetadata({ ...metadata, category: e.target.value })
                      }
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="Robotics">Robotics</option>
                      <option value="Computer Vision">Computer Vision</option>
                      <option value="Navigation">Navigation</option>
                      <option value="Autonomous Vehicles">
                        Autonomous Vehicles
                      </option>
                      <option value="Biometrics">Biometrics</option>
                      <option value="Industrial IoT">Industrial IoT</option>
                      <option value="Smart City">Smart City</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="tags"
                      className="block text-sm font-medium text-gray-300 mb-1"
                    >
                      Tags (press comma, space, or enter after each tag)
                    </label>
                    <input
                      type="text"
                      id="tags"
                      onKeyDown={handleTagInput}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g. robotics, vision, automation"
                    />
                    {/* Display tags as chips/pills */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {metadata.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-purple-900/50 text-purple-200 px-2 py-1 rounded-full text-xs flex items-center"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 text-purple-300 hover:text-purple-100"
                            aria-label={`Remove ${tag} tag`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="price"
                      className="block text-sm font-medium text-gray-300 mb-1"
                    >
                      Price (USD) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="price"
                      value={metadata.price}
                      onChange={(e) =>
                        setMetadata({
                          ...metadata,
                          price: e.target.value.replace(/[^0-9.]/g, ""),
                        })
                      }
                      className={`w-full bg-gray-700 border ${
                        formErrors.price ? "border-red-500" : "border-gray-600"
                      } rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                      placeholder="e.g. 299"
                      aria-describedby={
                        formErrors.price ? "price-error" : undefined
                      }
                      required
                    />
                    {formErrors.price && (
                      <p id="price-error" className="mt-1 text-xs text-red-400">
                        {formErrors.price}
                      </p>
                    )}
                  </div>

                  {/* License Type */}
                  <div className="border-t border-gray-700 pt-6">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-purple-400" />
                      Dataset License
                    </h4>
                    <label
                      htmlFor="license"
                      className="block text-sm font-medium text-gray-300 mb-1"
                    >
                      License Type
                    </label>
                    <select
                      id="license"
                      value={metadata.licenseType}
                      onChange={(e) =>
                        setMetadata({ ...metadata, licenseType: e.target.value })
                      }
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="cc0">CC0 Public Domain, Free</option>
                      <option value="cc-by">CC BY Attribution, Free</option>
                      <option value="cc-by-nc">CC BY-NC Non-Commercial, Free</option>
                      <option value="royalty-free">Royalty-Free, Paid</option>
                      <option value="commercial-resale">Commercial Resale, Premium</option>
                      <option value="exclusive">Exclusive Rights, Highest Price</option>
                      <option value="subscription">Subscription, Monthly or Yearly</option>
                      <option value="custom">Custom Terms</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-2">
                      {metadata.licenseType === "cc0" && "Anyone can use for any purpose, no attribution required"}
                      {metadata.licenseType === "cc-by" && "Free with attribution required"}
                      {metadata.licenseType === "cc-by-nc" && "Free for non-commercial use only"}
                      {metadata.licenseType === "royalty-free" && "One-time purchase for unlimited commercial use"}
                      {metadata.licenseType === "commercial-resale" && "Buyer can use commercially and resell to others"}
                      {metadata.licenseType === "exclusive" && "Single buyer gets all rights, unlisted after sale"}
                      {metadata.licenseType === "subscription" && "Time-limited access with recurring payments"}
                      {metadata.licenseType === "custom" && "Define custom licensing terms"}
                    </p>

                    {/* License Permissions */}
                    <div className="mt-4 space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={metadata.canCommercialUse}
                          onChange={(e) =>
                            setMetadata({ ...metadata, canCommercialUse: e.target.checked })
                          }
                          className="w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-purple-600"
                        />
                        <span className="text-sm text-gray-300">Commercial Use Allowed</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={metadata.canResale}
                          onChange={(e) =>
                            setMetadata({ ...metadata, canResale: e.target.checked })
                          }
                          className="w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-purple-600"
                        />
                        <span className="text-sm text-gray-300">Resale Rights Included</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={metadata.attributionRequired}
                          onChange={(e) =>
                            setMetadata({ ...metadata, attributionRequired: e.target.checked })
                          }
                          className="w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-purple-600"
                        />
                        <span className="text-sm text-gray-300">Attribution Required</span>
                      </label>
                    </div>
                  </div>

                  {/* Discovery Metadata */}
                  <div className="border-t border-gray-700 pt-6">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-400" />
                      Discovery Matching Metadata (Optional)
                    </h4>
                    <p className="text-xs text-gray-400 mb-4">
                      Add extra keywords that boost your visibility in search and help us match your dataset with incoming requests on the Discovery board. Examples: "dashcam/road-pothole", "location:NYC", "verified-by:sp1".
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="attestationCategory"
                          className="block text-sm font-medium text-gray-300 mb-1"
                        >
                          Category
                        </label>
                        <input
                          type="text"
                          id="attestationCategory"
                          value={metadata.attestationCategory}
                          onChange={(e) =>
                            setMetadata({ ...metadata, attestationCategory: e.target.value })
                          }
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="e.g. dashcam"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="attestationSubcategory"
                          className="block text-sm font-medium text-gray-300 mb-1"
                        >
                          Subcategory
                        </label>
                        <input
                          type="text"
                          id="attestationSubcategory"
                          value={metadata.attestationSubcategory}
                          onChange={(e) =>
                            setMetadata({ ...metadata, attestationSubcategory: e.target.value })
                          }
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="e.g. road-pothole"
                        />
                      </div>
                      <div className="col-span-2">
                        <label
                          htmlFor="attestationLocation"
                          className="block text-sm font-medium text-gray-300 mb-1"
                        >
                          Location
                        </label>
                        <input
                          type="text"
                          id="attestationLocation"
                          value={metadata.attestationLocation}
                          onChange={(e) =>
                            setMetadata({ ...metadata, attestationLocation: e.target.value })
                          }
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="e.g. NYC, California, USA"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Auto-publish toggle */}
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="font-medium text-white">
                        Auto-publish after verification
                      </h4>
                      <p className="text-sm text-gray-400">
                        Automatically publish your dataset if verification score
                        is above 85%
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleAutoPublish}
                      className="relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none"
                    >
                      {metadata.autoPublish ? (
                        <ToggleRight className="h-7 w-7 text-purple-500" />
                      ) : (
                        <ToggleLeft className="h-7 w-7 text-gray-500" />
                      )}
                      <span className="sr-only">Toggle auto-publish</span>
                    </button>
                  </div>

                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex items-start mb-4">
                      <div className="flex items-center h-5">
                        <input
                          id="terms"
                          type="checkbox"
                          checked={acceptedTerms}
                          onChange={() => {
                            setAcceptedTerms(!acceptedTerms);
                            if (!acceptedTerms) {
                              setFormErrors({
                                ...formErrors,
                                terms: undefined,
                              });
                            }
                          }}
                          className={`w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-purple-600 ${
                            formErrors.terms ? "border-red-500" : ""
                          }`}
                          aria-describedby={
                            formErrors.terms ? "terms-error" : undefined
                          }
                          required
                        />
                      </div>
                      <div className="ml-2 text-sm">
                        <label
                          htmlFor="terms"
                          className={`${formErrors.terms ? "text-red-400" : "text-gray-300"}`}
                        >
                          I agree to the{" "}
                          <button
                            type="button"
                            onClick={() => setShowTermsModal(true)}
                            className="text-purple-400 hover:text-purple-300"
                          >
                            Terms and Conditions
                          </button>{" "}
                          for dataset uploads{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        {formErrors.terms && (
                          <p
                            id="terms-error"
                            className="mt-1 text-xs text-red-400"
                          >
                            {formErrors.terms}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleStartVerification}
                        className={`${
                          !metadata.title ||
                          !metadata.description ||
                          !metadata.price ||
                          !acceptedTerms
                            ? "bg-gray-600 cursor-not-allowed"
                            : "bg-purple-600 hover:bg-purple-700"
                        } text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2`}
                        aria-label="Start verification process"
                      >
                        <Shield className="w-5 h-5" /> Start Verification
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Verifying Step */}
          {step === "verifying" && (
            <div className="max-w-2xl mx-auto text-center">
              <div className="bg-gray-800 rounded-xl p-8 mb-8">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
                  <div
                    className="absolute inset-0 border-4 border-t-green-500 rounded-full"
                    style={{
                      clipPath: `polygon(50% 50%, 50% 0, ${
                        50 +
                        50 * Math.sin((verificationScore / 100) * Math.PI * 2)
                      }% ${
                        50 -
                        50 * Math.cos((verificationScore / 100) * Math.PI * 2)
                      }%, 50% 50%)`,
                      transform: "rotate(-90deg)",
                    }}
                  ></div>
                  <Shield className="absolute inset-0 m-auto w-10 h-10 text-green-400" />
                  <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                    {verificationScore}%
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Verifying dataset quality...
                </h3>
                <p className="text-gray-400 mb-6">
                  Our AI is analyzing your dataset for quality and compliance
                </p>

                <div className="space-y-4 text-left max-w-md mx-auto">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                    <span className="text-gray-300">Format validation</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                    <span className="text-gray-300">Schema detection</span>
                  </div>
                  <div className="flex items-center">
                    {verificationScore > 40 ? (
                      <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                    ) : (
                      <Loader2 className="w-5 h-5 text-yellow-400 animate-spin mr-2" />
                    )}
                    <span className="text-gray-300">Quality assessment</span>
                  </div>
                  <div className="flex items-center">
                    {verificationScore > 60 ? (
                      <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                    ) : (
                      <Loader2 className="w-5 h-5 text-yellow-400 animate-spin mr-2" />
                    )}
                    <span className="text-gray-300">Content verification</span>
                  </div>
                  <div className="flex items-center">
                    {verificationScore > 80 ? (
                      <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                    ) : (
                      <Loader2 className="w-5 h-5 text-yellow-400 animate-spin mr-2" />
                    )}
                    <span className="text-gray-300">Compliance check</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {step === "complete" && (
            <div className="max-w-2xl mx-auto text-center">
              <div className="bg-gray-800 rounded-xl p-8 mb-8">
                <div className="w-24 h-24 rounded-full bg-green-900/30 mx-auto mb-6 flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">
                  Verification Complete!
                </h3>
                <p className="text-gray-400 mb-8">
                  Your dataset has been successfully verified with a quality
                  score of{" "}
                  <span className="text-green-400 font-semibold">
                    {verificationScore}%
                  </span>
                </p>

                <div className="bg-gray-700/50 rounded-lg p-6 mb-8 max-w-lg mx-auto text-left">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" /> AI Analysis
                    Summary
                  </h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Your dataset "{metadata.title}" has passed our verification
                    checks with a quality score of {verificationScore}%. The
                    dataset format is well-structured and the content appears to
                    be high-quality and relevant to its category.
                  </p>
                  <div className="mt-4">
                    <h5 className="text-sm font-medium mb-1">Status:</h5>
                    {metadata.autoPublish && verificationScore >= 85 ? (
                      <p className="text-green-400 font-medium flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Ready for publishing
                      </p>
                    ) : (
                      <p className="text-yellow-400 font-medium flex items-center gap-1">
                        <Clock className="w-4 h-4" /> Pending final review
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={isSubmitting}
                  className={`bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                    isSubmitting
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:bg-purple-700"
                  }`}
                >
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isSubmitting ? "Publishing..." : "Publish Dataset"}
                </button>
              </div>
            </div>
          )}

          {/* Terms Modal */}
          <TermsModal
            isOpen={showTermsModal}
            onClose={() => setShowTermsModal(false)}
            onAccept={() => {
              setAcceptedTerms(true);
              setShowTermsModal(false);
            }}
          />

          {/* Success Modal */}
          <DatasetUploadSuccessModal
            isOpen={showSuccessModal}
            onClose={() => setShowSuccessModal(false)}
            message={successMessage}
            datasetId={createdDatasetId}
            datasetHash={datasetHash}
            blockchainTxHash={blockchainTxHash}
            blockchainExplorerUrl={blockchainExplorerUrl}
          />
        </div>
      </div>
    </AuthGuard>
  );
}
