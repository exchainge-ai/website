import {
  DATASET_STATUS,
  type DatasetStatus,
  type ExtendedDataset,
} from "@/lib/types/dataset";

export interface DatasetDTO {
  id: string | number;
  title?: string | null;
  description?: string | null;
  priceUsd?: string | number | null;
  category?: string | null;
  categoryLabel?: string | null;
  tags?: string[] | null;
  fileFormat?: string | null;
  sizeFormatted?: string | null;
  sizeBytes?: number | string | null;
  status?: DatasetStatus | null;
  verificationScore?: number | string | null;
  verificationStatus?: "verified" | "pending" | "failed" | null;
  imageUrl?: string | null;
  previewImageUrl?: string | null;
  image?: string | null;
  previewUrl?: string | null;
  downloads?: number | string | null;
  downloadCount?: number | null;
  purchaseCount?: number | null;
  totalRevenueUsd?: number | string | null;
  viewCount?: number | null;
  rating?: number | string | null;
  averageRating?: number | string | null;
  updatedAt?: string | null;
  lastUpdatedAt?: string | null;
  createdAt?: string | null;
  userId?: string | null;
  licenseType?: string | null;
  canCommercialUse?: boolean | null;
  canResale?: boolean | null;
  attributionRequired?: boolean | null;
  datasetHash?: string | null;
  blockchainTxHash?: string | null;
  blockchainExplorerUrl?: string | null;
  uploadStatus?: string | null;
  uploadProgress?: number | null;
  uploadStartedAt?: string | null;
  uploadCompletedAt?: string | null;
  size?: string | null;
  isMarketplaceOnly?: boolean | null;
  attestations?: string[] | null;
}

interface DatasetMapperOptions {
  currentUserId?: string;
  fallbackImage?: string;
}

const DEFAULT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1200&auto=format&fit=crop&q=80";

function coerceNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const numeric = Number(value.replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  return null;
}

function toTitleCase(input: string): string {
  return input
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value?: string | null): string {
  if (!value) {
    return "Recently updated";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Recently updated";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDownloads(value?: number | null): string {
  if (!value || value <= 0) {
    return "0 downloads";
  }

  if (value < 1000) {
    return `${value.toLocaleString()} downloads`;
  }

  const units = ["k", "M", "B", "T"];
  let unitIndex = -1;
  let scaledValue = value;

  while (scaledValue >= 1000 && unitIndex < units.length - 1) {
    scaledValue /= 1000;
    unitIndex += 1;
  }

  const formatted =
    scaledValue < 10 ? scaledValue.toFixed(1) : Math.round(scaledValue).toString();
  return `${formatted}${units[unitIndex]} downloads`;
}

export function formatBytes(
  input?: number | string | null,
  decimals = 1,
): string {
  if (input == null) {
    return "Unknown size";
  }

  if (typeof input === "string") {
    const numeric = coerceNumber(input);
    if (numeric == null) {
      return input;
    }
    input = numeric;
  }

  if (input === 0) {
    return "0 B";
  }

  const k = 1024;
  const sizeUnits = ["B", "KB", "MB", "GB", "TB", "PB"];
  const exponent = Math.min(
    Math.floor(Math.log(input) / Math.log(k)),
    sizeUnits.length - 1,
  );
  const size = input / k ** exponent;
  const precision = size < 10 && exponent > 0 ? decimals : 0;

  return `${size.toFixed(precision)} ${sizeUnits[exponent]}`;
}

export function formatPriceUsd(
  value?: number | string | null,
  fallback = "$0.00",
): string {
  if (value == null) {
    return fallback;
  }

  const numeric = coerceNumber(value);
  if (numeric == null) {
    return fallback;
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numeric);
  } catch {
    return `$${numeric.toFixed(2)}`;
  }
}

function resolveVerificationStatus(
  status?: string | null,
  score?: number | null,
): "verified" | "pending" | "failed" | undefined {
  if (status === "verified" || status === "pending" || status === "failed") {
    return status;
  }

  if (score == null) {
    return undefined;
  }

  if (score >= 85) {
    return "verified";
  }

  if (score >= 50) {
    return "pending";
  }

  return "failed";
}

function resolveStatus(
  status?: DatasetStatus | null,
  isUserUploaded?: boolean,
): DatasetStatus {
  if (
    status === DATASET_STATUS.DRAFT ||
    status === DATASET_STATUS.PENDING ||
    status === DATASET_STATUS.LIVE ||
    status === DATASET_STATUS.REJECTED ||
    status === DATASET_STATUS.ARCHIVED
  ) {
    return status;
  }

  return isUserUploaded ? DATASET_STATUS.PENDING : DATASET_STATUS.LIVE;
}

function resolveImage(dto: DatasetDTO, fallbackImage?: string): string {
  return (
    dto.previewImageUrl ||
    dto.previewUrl ||
    dto.imageUrl ||
    dto.image ||
    fallbackImage ||
    DEFAULT_FALLBACK_IMAGE
  );
}

export function datasetDtoToCard(
  dto: DatasetDTO,
  options: DatasetMapperOptions = {},
): ExtendedDataset {
  const { currentUserId, fallbackImage } = options;

  const ownerId = dto.userId ?? null;
  const isOwner = Boolean(currentUserId && ownerId && currentUserId === ownerId);
  const verificationScore = coerceNumber(dto.verificationScore);
  const downloadsCount =
    dto.downloadCount ?? dto.purchaseCount ?? coerceNumber(dto.downloads) ?? 0;
  const ratingValue =
    coerceNumber(dto.rating) ??
    coerceNumber(dto.averageRating) ??
    4.8;

  const categoryLabel =
    dto.categoryLabel ??
    (dto.category ? toTitleCase(dto.category) : "General");

  const datasetCard: ExtendedDataset = {
    id: String(dto.id ?? ""),
    title: dto.title?.trim() || "Untitled Dataset",
    description:
      dto.description?.trim() ||
      "Detailed description coming soon. Contact the dataset owner for more information.",
    price: formatPriceUsd(dto.priceUsd),
    category: categoryLabel,
    size:
      dto.sizeFormatted ||
      dto.size ||
      (dto.sizeBytes != null
        ? formatBytes(
            typeof dto.sizeBytes === "string"
              ? coerceNumber(dto.sizeBytes) ?? 0
              : dto.sizeBytes,
          )
        : "Unknown size"),
    format: dto.fileFormat ?? "ZIP",
    rating: ratingValue ?? 0,
    downloads: formatDownloads(downloadsCount ?? 0),
    lastUpdated: formatDate(
      dto.updatedAt || dto.lastUpdatedAt || dto.createdAt,
    ),
    tags: Array.isArray(dto.tags) ? dto.tags : [],
    image: resolveImage(dto, fallbackImage),
    verificationScore: verificationScore ?? undefined,
    status: resolveStatus(dto.status ?? undefined, isOwner),
    actionLabel: isOwner ? "Manage" : "Purchase",
    isUserUploaded: isOwner,
    verificationStatus: resolveVerificationStatus(
      dto.verificationStatus ?? undefined,
      verificationScore,
    ),
    isMarketplaceOnly: Boolean(dto.isMarketplaceOnly && !isOwner),
  };

  return datasetCard;
}
