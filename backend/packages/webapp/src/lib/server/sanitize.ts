/**
 * Sanitize user input to prevent XSS attacks
 * Simple approach that strips all HTML without dependencies
 */

/**
 * Remove HTML tags and dangerous characters from string
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return "";

  return dirty
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/[<>]/g, "") // Remove any remaining angle brackets
    .trim();
}

/**
 * Sanitize dataset input fields
 */
export function sanitizeDatasetInput(data: {
  title?: string;
  description?: string;
  tags?: string[];
}) {
  const cleanTags = data.tags
    ?.map((tag) => sanitizeHtml(tag))
    .filter((tag) => Boolean(tag));

  return {
    title: data.title ? sanitizeHtml(data.title) : undefined,
    description: data.description ? sanitizeHtml(data.description) : undefined,
    tags: cleanTags,
  };
}
