import { Hono } from "hono";
import { cors } from "hono/cors";
import { Env, ShortenRequest, ShortenResponse, UrlRecord } from "./types";
import { isSafePublicUrl } from "./ssrf";
import { generateRandomSlug, validateCustomSlug, RESERVED_SLUGS } from "./slug";
import { isCrawlerBot, renderCrawlerHtml } from "./bot";
import { scrapeTargetMetadata } from "./scraper";
import { renderWebUi } from "./ui";

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for API routes
app.use("/api/*", cors());

// Health Check
app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    environment: c.env.ENVIRONMENT || "production",
    timestamp: new Date().toISOString()
  });
});

// Serve Web UI with Strict Edge Security Headers
app.get("/", (c) => {
  c.header(
    "Content-Security-Policy",
    "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none';"
  );
  c.header("X-Frame-Options", "DENY");
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "interest-cohort=(), camera=(), microphone=(), geolocation=()");
  return c.html(renderWebUi());
});

// Create Short URL (Dual Access: Web UI & Developer API)
app.post("/api/shorten", async (c) => {
  let createdBy = "public";

  // Optional API Key validation if configured
  const authHeader = c.req.header("Authorization");
  if (c.env.API_KEY && authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (token !== c.env.API_KEY) {
      return c.json({ error: "Unauthorized: Invalid API key" }, 401);
    }
    createdBy = "api";
  }

  let body: ShortenRequest;
  try {
    body = await c.req.json<ShortenRequest>();
  } catch {
    return c.json({ error: "Invalid JSON request body" }, 400);
  }

  if (!body.url || typeof body.url !== "string") {
    return c.json({ error: "A valid 'url' string field is required" }, 400);
  }

  const rawUrl = body.url.trim();

  // SSRF and protocol validation
  const safety = isSafePublicUrl(rawUrl);
  if (!safety.safe) {
    return c.json({ error: safety.error || "Invalid or restricted destination URL" }, 400);
  }

  const db = c.env.DB;
  if (!db) {
    return c.json({ error: "D1 Database binding 'DB' is not configured" }, 500);
  }

  let slug = "";

  if (body.custom_slug) {
    const customValidation = validateCustomSlug(body.custom_slug);
    if (!customValidation.valid) {
      return c.json({ error: customValidation.error }, 400);
    }
    slug = body.custom_slug.trim();

    // Check availability in clustered table
    const existing = await db
      .prepare("SELECT slug FROM urls WHERE slug = ? LIMIT 1")
      .bind(slug)
      .first<{ slug: string }>();

    if (existing) {
      return c.json({ error: `The custom slug '${slug}' is already taken` }, 409);
    }
  } else {
    // Generate unique 4-character Base62 slug with collision retry
    let attempts = 0;
    const maxAttempts = 5;
    while (attempts < maxAttempts) {
      const candidate = generateRandomSlug(4);
      if (RESERVED_SLUGS.has(candidate.toLowerCase())) {
        attempts++;
        continue;
      }

      const existing = await db
        .prepare("SELECT slug FROM urls WHERE slug = ? LIMIT 1")
        .bind(candidate)
        .first<{ slug: string }>();

      if (!existing) {
        slug = candidate;
        break;
      }
      attempts++;
    }

    if (!slug) {
      return c.json({ error: "Failed to allocate a unique slug. Please try again or specify a custom slug." }, 500);
    }
  }

  // Pre-scrape metadata (manual overrides take precedence)
  let title = body.title?.trim() || null;
  let description = body.description?.trim() || null;
  let imageUrl = body.image_url?.trim() || null;

  if (!title || !description || !imageUrl) {
    const scraped = await scrapeTargetMetadata(rawUrl);
    if (!title && scraped.title) title = scraped.title;
    if (!description && scraped.description) description = scraped.description;
    if (!imageUrl && scraped.image_url) imageUrl = scraped.image_url;
  }

  // Store in D1 (WITHOUT ROWID, readable UTF-8)
  await db
    .prepare(
      "INSERT INTO urls (slug, target_url, title, description, image_url, created_by) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(slug, rawUrl, title, description, imageUrl, createdBy)
    .run();

  const forwardedHost = c.req.header("x-forwarded-host");
  const forwardedProto = c.req.header("x-forwarded-proto") || "https";
  const origin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : new URL(c.req.url).origin;
  const shortUrl = `${origin}/${slug}`;

  // Pre-warm Edge Cache for Social Bots
  if (typeof caches !== "undefined" && caches.default) {
    try {
      const crawlerHtml = renderCrawlerHtml({
        targetUrl: rawUrl,
        title,
        description,
        image_url: imageUrl
      });

      const cachedResponse = new Response(crawlerHtml, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, s-maxage=604800, max-age=604800"
        }
      });

      c.executionCtx.waitUntil(caches.default.put(new Request(shortUrl), cachedResponse));
    } catch {
      // Non-fatal
    }
  }

  const responsePayload: ShortenResponse = {
    success: true,
    slug,
    short_url: shortUrl,
    target_url: rawUrl,
    metadata: {
      title,
      description,
      image_url: imageUrl
    }
  };

  return c.json(responsePayload, 201);
});

// Slug Redirection & Social Preview Handler
app.get("/:slug", async (c) => {
  const slug = c.req.param("slug");

  if (RESERVED_SLUGS.has(slug.toLowerCase())) {
    return c.notFound();
  }

  const userAgent = c.req.header("User-Agent");
  const isBot = isCrawlerBot(userAgent);

  // Bot Fast-Path: Check Cloudflare Edge Cache API first (<5ms)
  if (isBot && typeof caches !== "undefined" && caches.default) {
    try {
      const cached = await caches.default.match(c.req.raw);
      if (cached) {
        return cached;
      }
    } catch {
      // Fallback
    }
  }

  const db = c.env.DB;
  if (!db) {
    return c.text("Internal Server Error: Database not configured", 500);
  }

  // Clustered single B-Tree lookup
  const record = await db
    .prepare("SELECT target_url, title, description, image_url FROM urls WHERE slug = ? LIMIT 1")
    .bind(slug)
    .first<Pick<UrlRecord, "target_url" | "title" | "description" | "image_url">>();

  if (!record) {
    return c.html(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:4rem;background:#0b0f19;color:#fff;">
        <h1>404 - Link Not Found</h1>
        <p>The short link <code>/${slug}</code> does not exist or has expired.</p>
        <a href="/" style="color:#3b82f6;">Create a short link</a>
      </body></html>`,
      404
    );
  }

  // Social Bot Path: Render HTML card (with SVG fallback) & store in Edge Cache
  if (isBot) {
    const html = renderCrawlerHtml({
      targetUrl: record.target_url,
      title: record.title,
      description: record.description,
      image_url: record.image_url
    });

    const response = new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, s-maxage=604800, max-age=604800"
      }
    });

    if (typeof caches !== "undefined" && caches.default) {
      try {
        c.executionCtx.waitUntil(caches.default.put(c.req.raw, response.clone()));
      } catch {
        // Continue
      }
    }

    return response;
  }

  // Human User Path: Sub-10ms Edge-Cached Redirect
  // Cloudflare CDN caches this 307 across global PoPs for 24h
  c.header("Cache-Control", "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800");
  return c.redirect(record.target_url, 307);
});

export default app;
