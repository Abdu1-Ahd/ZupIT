/**
 * Server-Side Request Forgery (SSRF) Guard
 * Validates URLs before server-side scraping to protect internal networks.
 */

const PRIVATE_IP_PATTERNS = [
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,                // 127.0.0.0/8 (Loopback)
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,                 // 10.0.0.0/8 (Private)
  /^192\.168\.\d{1,3}\.\d{1,3}$/,                    // 192.168.0.0/16 (Private)
  /^169\.254\.\d{1,3}\.\d{1,3}$/,                    // 169.254.0.0/16 (Link-local)
  /^0\.0\.0\.0$/,                                     // Current network
  /^::1$/,                                            // IPv6 Loopback
  /^fe80:/i,                                          // IPv6 Link-local
  /^fc00:/i,                                          // IPv6 Unique local
  /^fd00:/i                                           // IPv6 Unique local
];

export function isSafePublicUrl(targetUrl: string): { safe: boolean; error?: string; parsed?: URL } {
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return { safe: false, error: "Invalid URL format" };
  }

  // Only allow HTTP/HTTPS
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { safe: false, error: "Only http and https protocols are permitted" };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost and standard reserved domains
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname === "metadata.google.internal"
  ) {
    return { safe: false, error: "Access to local or internal hostnames is prohibited" };
  }

  // Check 172.16.0.0/12 (172.16.0.0 to 172.31.255.255)
  const ipMatch = hostname.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  if (ipMatch) {
    const octet = parseInt(ipMatch[1], 10);
    if (octet >= 16 && octet <= 31) {
      return { safe: false, error: "Access to private IP range 172.16.0.0/12 is prohibited" };
    }
  }

  // Check other private IP blocks
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return { safe: false, error: "Access to private or link-local IP addresses is prohibited" };
    }
  }

  return { safe: true, parsed };
}

