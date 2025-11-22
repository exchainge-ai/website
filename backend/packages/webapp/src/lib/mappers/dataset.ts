import type { Database } from "@exchainge/supabase/database";
import type { DatasetCardBase, DatasetCategory, DatasetStatus } from "@/lib/types/dataset";

export type DatasetRow = Database["public"]["Tables"]["datasets"]["Row"];
export type DatasetUploadStatus =
  Database["public"]["Tables"]["datasets"]["Row"]["upload_status"];

export interface DatasetDTO {
  id: string;
  userId: string;
  title: string;
  description: string;
  priceUsd: string;
  category: DatasetCategory;
  categoryLabel: string;
  tags: string[];
  fileFormat: string;
  sizeBytes: number;
  sizeFormatted: string;
  status: DatasetStatus;
  verificationScore: number | null;
  verificationStatus: "verified" | "pending" | "failed";
  isMarketplaceOnly: boolean;
  thumbnailUrl: string | null;
  viewCount: number;
  downloadCount: number;
  purchaseCount: number;
  averageRating: number | null;
  totalRevenueUsd: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  uploadStatus: DatasetUploadStatus;
  uploadProgress: number;
  uploadStartedAt: string | null;
  uploadCompletedAt: string | null;
  // Blockchain fields
  blockchainTxHash: string | null;
  blockchainRegistryAccount: string | null;
  blockchainExplorerUrl: string | null;
  datasetHash: string | null;
  // License fields
  licenseType: string | null;
  canCommercialUse: boolean;
  canResale: boolean;
  attributionRequired: boolean;
  // Attestations
  attestations: string[];
  semanticTags: Record<string, string>;
}

const CATEGORY_LABELS: Record<DatasetCategory, string> = {
  robotics: "Robotics",
  autonomous_vehicles: "Autonomous Vehicles",
  drone: "Drone",
  manipulation: "Manipulation",
  navigation: "Navigation",
  sensor_data: "Sensor Data",
  human_robot_interaction: "Human-Robot Interaction",
  embodied_ai: "Embodied AI",
  motion_capture: "Motion Capture",
  other: "Other",
};

const CATEGORY_PLACEHOLDER_IMAGE: Partial<Record<DatasetCategory, string>> = {
  robotics: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop",
  autonomous_vehicles: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop",
  navigation: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&h=300&fit=crop",
  human_robot_interaction: "https://images.unsplash.com/photo-1527430253228-e93688616381?w=400&h=300&fit=crop",
  sensor_data: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=300&fit=crop",
  motion_capture: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop",
};

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatPriceUsd(value: string | number | null | undefined): string {
  const amount = toNumber(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatBytes(bytes: number | null | undefined): string {
  const safeBytes = bytes ?? 0;
  if (safeBytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(safeBytes) / Math.log(1024)),
    units.length - 1,
  );

  const value = safeBytes / 1024 ** exponent;
  return `${value.toFixed(value < 10 && exponent > 0 ? 1 : 0)} ${units[exponent]}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return new Date().toISOString().split("T")[0];
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString().split("T")[0];
}

export function datasetRowToDTO(row: DatasetRow): DatasetDTO {
  const categoryLabel = CATEGORY_LABELS[row.category];
  const verificationScore = row.verification_score ?? null;
  const verificationStatus =
    verificationScore !== null && verificationScore >= 85
      ? "verified"
      : verificationScore !== null
        ? "pending"
        : "pending";

  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    priceUsd: row.price_usdc ?? "0",
    category: row.category,
    categoryLabel,
    tags: row.tags ?? [],
    fileFormat: row.file_format,
    sizeBytes: row.size_bytes,
    sizeFormatted: row.size_formatted ?? formatBytes(row.size_bytes),
    status: row.status,
    verificationScore,
    verificationStatus,
    isMarketplaceOnly: row.is_marketplace_only ?? false,
    thumbnailUrl: row.thumbnail_url,
    viewCount: row.view_count ?? 0,
    downloadCount: row.download_count ?? 0,
    purchaseCount: row.purchase_count ?? 0,
    averageRating: row.average_rating ? Number(row.average_rating) : null,
    totalRevenueUsd: row.total_revenue ?? "0",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    uploadStatus: ((row as any).upload_status ?? "complete") as DatasetUploadStatus,
    uploadProgress: Number((row as any).upload_progress ?? 100),
    uploadStartedAt: (row as any).upload_started_at ?? null,
    uploadCompletedAt: (row as any).upload_completed_at ?? null,
    // Blockchain fields
    blockchainTxHash: (row as any).blockchain_tx_hash ?? null,
    blockchainRegistryAccount: (row as any).blockchain_registry_account ?? null,
    blockchainExplorerUrl: (row as any).blockchain_explorer_url ?? null,
    datasetHash: (row as any).dataset_hash ?? null,
    // License fields
    licenseType: (row as any).license_type ?? null,
    canCommercialUse: (row as any).can_commercial_use ?? false,
    canResale: (row as any).can_resale ?? false,
    attributionRequired: row.attribution_required ?? true,
    // Attestations
    attestations: (row as any).attestations ?? [],
    semanticTags: (row as any).semantic_tags ?? {},
  };
}

function resolveImage(dto: DatasetDTO): string {
  if (dto.thumbnailUrl) {
    return dto.thumbnailUrl;
  }

  return (
    CATEGORY_PLACEHOLDER_IMAGE[dto.category] ?? "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop"
  );
}

function resolveRating(dto: DatasetDTO): number {
  if (dto.averageRating !== null && Number.isFinite(dto.averageRating)) {
    return Number(dto.averageRating.toFixed(1));
  }
  return 4.6;
}

export function datasetDtoToCard(
  dto: DatasetDTO,
  options?: { currentUserId?: string },
): DatasetCardBase {
  const isOwner =
    options?.currentUserId !== undefined &&
    options.currentUserId === dto.userId;

  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    price: formatPriceUsd(dto.priceUsd),
    category: dto.categoryLabel,
    size: dto.sizeFormatted,
    format: dto.fileFormat,
    rating: resolveRating(dto),
    downloads: dto.downloadCount.toLocaleString("en-US"),
    lastUpdated: formatDate(dto.updatedAt ?? dto.createdAt),
    tags: dto.tags,
    image: resolveImage(dto),
    verificationScore: dto.verificationScore ?? undefined,
    status: dto.status,
    actionLabel: isOwner ? "Manage" : "Purchase",
    isUserUploaded: isOwner,
    verificationStatus: dto.verificationStatus,
    isMarketplaceOnly: dto.isMarketplaceOnly,
  };
}
