import { logger } from "@/lib/server/logger";

const DEFAULT_BLOCKLIST = [
  "fuck",
  "shit",
  "slut",
  "nigger",
  "bitch",
  "cunt",
];

function loadBlocklist(): string[] {
  const fromEnv = (process.env.CONTENT_BLOCKLIST ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(new Set([...DEFAULT_BLOCKLIST, ...fromEnv]));
}

function normalizeForComparison(value: string): string {
  const LEET_MAP: Record<string, string> = {
    "0": "o",
    "1": "i",
    "3": "e",
    "4": "a",
    "5": "s",
    "7": "t",
  };

  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[013457]/g, (digit) => LEET_MAP[digit] ?? digit)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function containsDisallowedTerm(value: string, blocklist: string[]) {
  if (!value) {
    return null;
  }

  const normalized = normalizeForComparison(value);
  for (const term of blocklist) {
    if (!term) continue;
    const escaped = term.replace(/[^a-z0-9]/g, " ").trim();
    if (!escaped) continue;

    const pattern = new RegExp(`\\b${escaped}\\b`, "i");
    if (pattern.test(normalized)) {
      return term;
    }
  }

  return null;
}

export class ContentModerationError extends Error {
  constructor(
    public readonly field: "title" | "description" | "tags",
    public readonly term: string,
  ) {
    super(`Content moderation failed for ${field}`);
    this.name = "ContentModerationError";
  }
}

export function enforceCleanContent(fields: {
  title?: string;
  description?: string;
  tags?: string[];
}) {
  const blocklist = loadBlocklist();

  const pairs: Array<[keyof typeof fields, string | undefined]> = [
    ["title", fields.title],
    ["description", fields.description],
  ];

  for (const [field, value] of pairs) {
    if (!value) continue;
    const match = containsDisallowedTerm(value, blocklist);
    if (match) {
      logger.warn("Content moderation rejected input", {
        field,
        reason: "blocklist_match",
      });
      throw new ContentModerationError(field, match);
    }
  }

  if (fields.tags?.length) {
    for (const tag of fields.tags) {
      const match = containsDisallowedTerm(tag, blocklist);
      if (match) {
        logger.warn("Content moderation rejected input", {
          field: "tags",
          reason: "blocklist_match",
        });
        throw new ContentModerationError("tags", match);
      }
    }
  }
}
