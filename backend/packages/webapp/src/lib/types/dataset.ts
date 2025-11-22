import type { Database } from "@exchainge/supabase/database";

export type DatasetStatus = Database["public"]["Enums"]["dataset_status"];
export type DatasetCategory = Database["public"]["Enums"]["dataset_category"];

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
}
