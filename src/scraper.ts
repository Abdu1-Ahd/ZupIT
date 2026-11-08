import { ExtractedMetadata } from "./types";
import { isSafePublicUrl } from "./ssrf";

/**
 * Streaming metadata scraper for OpenGraph and Twitter Card data.
 * Automatically times out after 2.5s and handles anti-bot failures gracefully.
 */
export async function scrapeTargetMetadata(targetUrl: string): Promise<ExtractedMetadata> {
  const safety = isSafePublicUrl(targetUrl);
  if (!safety.safe) {
    return { title: null, description: null, image_url: null };
  }

  const meta: ExtractedMetadata = {
    title: null,
    description: null,
    image_url: null
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; EdgeLinkBot/1.0; +https://workers.dev)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      redirect: "follow"
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return meta;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      return meta;
    }

    // Check if HTMLRewriter is available in Cloudflare Workers runtime
    if (typeof HTMLRewriter !== "undefined") {
      let rawTitle = "";

      const rewriter = new HTMLRewriter()
        .on("title", {
          text(text) {
            rawTitle += text.text;
          }
        })
        .on("meta", {
          element(element) {
            const prop = element.getAttribute("property") || element.getAttribute("name");
            const content = element.getAttribute("content");
            if (!prop || !content) return;

            const lowerProp = prop.toLowerCase();
            if ((lowerProp === "og:title" || lowerProp === "twitter:title") && !meta.title) {
              meta.title = content.trim();
            } else if (
              (lowerProp === "og:description" ||
                lowerProp === "twitter:description" ||
                lowerProp === "description") &&
              !meta.description
            ) {
              meta.description = content.trim();
            } else if (
              (lowerProp === "og:image" ||
                lowerProp === "twitter:image" ||
                lowerProp === "twitter:image:src") &&
              !meta.image_url
            ) {
              meta.image_url = resolveUrl(targetUrl, content.trim());
            }
          }
        });

      // Stream transform and consume to populate handlers
      const transformed = rewriter.transform(response);
      await transformed.text();

      if (!meta.title && rawTitle.trim()) {
        meta.title = rawTitle.trim();
      }
    } else {
      // Regex fallback for non-Cloudflare environments (e.g. Node / Vitest tests)
      const html = await response.text();
      meta.title = extractTagContent(html, /<meta[^>]+(?:property|name)=["'](?:og:title|twitter:title)["'][^>]+content=["']([^"']+)["']/i) ||
                   extractTagContent(html, /<title[^>]*>([^<]+)<\/title>/i);
      meta.description = extractTagContent(html, /<meta[^>]+(?:property|name)=["'](?:og:description|twitter:description|description)["'][^>]+content=["']([^"']+)["']/i);
      const rawImg = extractTagContent(html, /<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/i);
      meta.image_url = rawImg ? resolveUrl(targetUrl, rawImg) : null;
    }
  } catch {
    // Return empty metadata on network abort, timeout, or parsing error
  }

  return meta;
}

function extractTagContent(html: string, regex: RegExp): string | null {
  const match = html.match(regex);
  return match && match[1] ? match[1].trim() : null;
}

function resolveUrl(baseUrl: string, relativeOrAbsolute: string): string {
  try {
    return new URL(relativeOrAbsolute, baseUrl).toString();
  } catch {
    return relativeOrAbsolute;
  }
}

