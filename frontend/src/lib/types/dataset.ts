export type DatasetStatus =
  | "draft"
  | "pending"
  | "live"
  | "rejected"
  | "archived";

export type DatasetCategory = string;

export const DATASET_STATUS = {
  DRAFT: "draft",
  PENDING: "pending",
  LIVE: "live",
  REJECTED: "rejected",
  ARCHIVED: "archived",
} as const satisfies Record<string, DatasetStatus>;

export interface DatasetCardBase {
  id: string;
  title: string;
  description: string;
  price: string;
  category: string;
  size: string;
  format: string;
  rating: number;
  downloads: string;
  lastUpdated: string;
  tags: string[];
  image: string;
  verificationScore?: number;
  status?: DatasetStatus;
  actionLabel?: string;
  isUserUploaded?: boolean;
  verificationStatus?: "verified" | "pending" | "failed";
  isMarketplaceOnly?: boolean;
  blockchainTxHash?: string | null;
  blockchainExplorerUrl?: string | null;
  datasetHash?: string | null;
}

export interface ExtendedDataset extends DatasetCardBase {
  isUserUploaded?: boolean;
  verificationStatus?: "verified" | "pending" | "failed";
  status?: DatasetStatus;
  actionLabel?: string;
  isMarketplaceOnly?: boolean;
}
