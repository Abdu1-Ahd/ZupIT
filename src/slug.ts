const BASE62_CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const RESERVED_SLUGS = new Set([
  "",
  "api",
  "health",
  "robots.txt",
  "favicon.ico",
  "sitemap.xml",
  "static",
  "assets",
  "dashboard",
  "shorten",
  "admin"
]);

/**
 * Generate a cryptographically secure Base62 random slug.
 * Length 4 gives 62^4 = ~14.7 million unique combinations.
 */
export function generateRandomSlug(length = 4): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += BASE62_CHARS[bytes[i] % 62];
  }
  return result;
}

/**
 * Validate user-supplied custom slug.
 * Must be 1-32 characters, alphanumeric, hyphen or underscore, and not reserved.
 */
export function validateCustomSlug(slug: string): { valid: boolean; error?: string } {
  const trimmed = slug.trim();
  if (trimmed.length < 1 || trimmed.length > 32) {
    return { valid: false, error: "Slug must be between 1 and 32 characters" };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { valid: false, error: "Slug can only contain letters, numbers, hyphens, and underscores" };
  }

  if (RESERVED_SLUGS.has(trimmed.toLowerCase())) {
    return { valid: false, error: `The slug '${trimmed}' is a reserved system keyword` };
  }

  return { valid: true };
}

