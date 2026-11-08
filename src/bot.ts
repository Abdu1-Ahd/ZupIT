const BOT_UA_REGEX = 
  /bot|spider|crawl|facebookexternalhit|whatsapp|slackbot|discordbot|twitterbot|telegrambot|linkedinbot|pinterest|embedly|quora link preview|vkshare|skypeuripreview|applebot/i;

export function isCrawlerBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return BOT_UA_REGEX.test(userAgent);
}

export function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Generate a clean, branded SVG fallback image as a data URI
 * when the destination site has no OpenGraph thumbnail.
 */
export function generateFallbackCardSvg(title: string, domain: string): string {
  const safeTitle = escapeHtml(title.slice(0, 70));
  const safeDomain = escapeHtml(domain);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#1e1b4b"/>
      </linearGradient>
      <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#3b82f6"/>
        <stop offset="100%" stop-color="#8b5cf6"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)"/>
    <circle cx="1100" cy="100" r="300" fill="#3b82f6" opacity="0.08"/>
    <circle cx="100" cy="550" r="250" fill="#8b5cf6" opacity="0.08"/>
    
    <!-- Header / Domain pill -->
    <rect x="100" y="100" width="220" height="48" rx="24" fill="rgba(59, 130, 246, 0.15)" stroke="rgba(59, 130, 246, 0.4)" stroke-width="2"/>
    <text x="210" y="131" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="600" fill="#60a5fa" text-anchor="middle">
      ${safeDomain}
    </text>

    <!-- Main Title -->
    <text x="100" y="270" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="700" fill="#ffffff" letter-spacing="-0.02em">
      <tspan x="100" dy="0">${safeTitle}</tspan>
    </text>

    <!-- Bottom Accent Bar -->
    <rect x="100" y="490" width="1000" height="4" rx="2" fill="url(#accent)"/>
    <text x="100" y="530" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="500" fill="#94a3b8">
      Instant Edge Redirect &bull; Verified Link
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function renderCrawlerHtml(data: {
  targetUrl: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
}): string {
  let domain = "";
  try {
    domain = new URL(data.targetUrl).hostname.replace(/^www\./, "");
  } catch {
    domain = "Link";
  }

  const titleText = data.title || `Redirecting to ${domain}`;
  const title = escapeHtml(titleText);
  const description = escapeHtml(data.description || `Click to open ${domain}`);
  
  // Use destination image if available, otherwise use high-resolution generated SVG card
  const imageUrl = data.image_url 
    ? escapeHtml(data.image_url) 
    : generateFallbackCardSvg(titleText, domain);

  const targetUrl = escapeHtml(data.targetUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${targetUrl}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${escapeHtml(domain)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">
  <meta http-equiv="refresh" content="0; url=${targetUrl}">
</head>
<body style="background:#0b0f19;color:#f9fafb;font-family:sans-serif;padding:2rem;text-align:center;">
  <p>Redirecting to <a href="${targetUrl}" style="color:#60a5fa;">${title}</a>...</p>
  <script>window.location.replace("${targetUrl}");</script>
</body>
</html>`;
}
