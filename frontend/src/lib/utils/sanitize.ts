/**
 * Security utility for sanitizing user input
 * Prevents XSS attacks by stripping malicious HTML/JavaScript
 */

import DOMPurify from "dompurify";

/**
 * Sanitize HTML content to prevent XSS attacks
 * Use this for any user-generated content displayed in the app
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === "undefined") {
    // Server-side: return as-is (will be sanitized client-side)
    return dirty;
  }

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br"],
    ALLOWED_ATTR: ["href", "target"],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}

/**
 * Sanitize plain text (strip all HTML)
 * Use this for titles, descriptions, etc.
 */
export function sanitizeText(dirty: string): string {
  if (typeof window === "undefined") {
    return dirty;
  }

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Escape HTML entities
 * Use for displaying user input as plain text
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Validate and sanitize URL
 * Prevents javascript: and data: URIs
 */
export function sanitizeUrl(url: string): string {
  const dangerous = /^(javascript|data|vbscript|file|about):/i;
  if (dangerous.test(url)) {
    return "#";
  }
  return url;
}
