/**
 * Dataset Licensing Types
 * Legal licensing models with blockchain proof
 */

export type LicenseType =
  | "cc0" // Public domain, no restrictions
  | "cc-by" // Attribution required
  | "cc-by-sa" // Attribution + ShareAlike
  | "cc-by-nc" // Attribution + Non-Commercial
  | "exclusive" // Single buyer only
  | "commercial-resale" // Buyer can resell
  | "royalty-free" // One-time purchase, unlimited use
  | "subscription" // Time-limited access
  | "custom"; // Custom negotiated terms

export interface LicenseTerms {
  type: LicenseType;
  priceUsd: number;
  canCommercialUse: boolean;
  canResale: boolean;
  attributionRequired: boolean;
  customTerms?: string;
  expirationDays?: number; // For subscription licenses
}

export const LICENSE_METADATA: Record<
  LicenseType,
  {
    label: string;
    description: string;
    icon: string;
    popular?: boolean;
    priceMultiplier: number; // Relative pricing
  }
> = {
  cc0: {
    label: "CC0 Public Domain",
    description: "Free for any use, no attribution required",
    icon: "PD",
    popular: true,
    priceMultiplier: 0,
  },
  "cc-by": {
    label: "CC BY Attribution",
    description: "Free with attribution required",
    icon: "BY",
    popular: true,
    priceMultiplier: 0.5,
  },
  "cc-by-sa": {
    label: "CC BY-SA ShareAlike",
    description: "Free with attribution, derivatives must use same license",
    icon: "SA",
    priceMultiplier: 0.7,
  },
  "cc-by-nc": {
    label: "CC BY-NC Non-Commercial",
    description: "Free for non-commercial use only",
    icon: "NC",
    priceMultiplier: 0.8,
  },
  "royalty-free": {
    label: "Royalty-Free",
    description: "One-time purchase, unlimited commercial use",
    icon: "RF",
    popular: true,
    priceMultiplier: 1.0,
  },
  "commercial-resale": {
    label: "Commercial Resale",
    description: "Buyer can use commercially and resell to others",
    icon: "CR",
    priceMultiplier: 2.0,
  },
  exclusive: {
    label: "Exclusive Rights",
    description: "Single buyer gets all rights, dataset unlisted after sale",
    icon: "EX",
    priceMultiplier: 5.0,
  },
  subscription: {
    label: "Subscription",
    description: "Time-limited access, monthly or yearly",
    icon: "SB",
    priceMultiplier: 0.2,
  },
  custom: {
    label: "Custom Terms",
    description: "Negotiate custom licensing agreement",
    icon: "CT",
    priceMultiplier: 1.0,
  },
};

/**
 * Generate license terms text for display/blockchain
 */
export function generateLicenseTermsText(terms: LicenseTerms): string {
  const { type, priceUsd, canCommercialUse, canResale, attributionRequired, customTerms } = terms;
  const meta = LICENSE_METADATA[type];

  let text = `LICENSE AGREEMENT\n\n`;
  text += `License Type: ${meta.label}\n`;
  text += `Price: $${priceUsd.toFixed(2)} USD\n\n`;
  text += `TERMS:\n`;
  text += `• Commercial Use: ${canCommercialUse ? "Allowed" : "Not Allowed"}\n`;
  text += `• Resale Rights: ${canResale ? "Allowed" : "Not Allowed"}\n`;
  text += `• Attribution: ${attributionRequired ? "Required" : "Not Required"}\n`;

  if (terms.expirationDays) {
    text += `• License Duration: ${terms.expirationDays} days\n`;
  } else {
    text += `• License Duration: Perpetual\n`;
  }

  if (customTerms) {
    text += `\nCUSTOM TERMS:\n${customTerms}\n`;
  }

  text += `\nThis license is cryptographically signed and recorded on the Solana blockchain.\n`;
  text += `Generated at: ${new Date().toISOString()}\n`;

  return text;
}

/**
 * Semantic attestation for advanced search
 */
export interface SemanticAttestation {
  category?: string; // "dashcam", "lidar", "medical", etc.
  subcategory?: string; // "road-pothole", "tumor-detection", etc.
  location?: string; // "NYC", "California", "USA", etc.
  verifiedBy?: string; // "sp1", "ai-verified", "manual", etc.
  quality?: string; // "high", "medium", "low"
  tags?: string[]; // Additional freeform tags
}

/**
 * Convert attestation to searchable array format
 */
export function attestationToArray(attestation: SemanticAttestation): string[] {
  const result: string[] = [];

  if (attestation.category) {
    if (attestation.subcategory) {
      result.push(`${attestation.category}/${attestation.subcategory}`);
    } else {
      result.push(attestation.category);
    }
  }

  if (attestation.location) {
    result.push(`location:${attestation.location}`);
  }

  if (attestation.verifiedBy) {
    result.push(`verified-by:${attestation.verifiedBy}`);
  }

  if (attestation.quality) {
    result.push(`quality:${attestation.quality}`);
  }

  if (attestation.tags) {
    result.push(...attestation.tags);
  }

  return result;
}
