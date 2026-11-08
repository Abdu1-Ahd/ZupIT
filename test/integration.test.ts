import { describe, it, expect, vi } from "vitest";
import app from "../src/index";
import { Env } from "../src/types";

// In-memory mock for Cloudflare D1
function createMockD1(): D1Database {
  const store = new Map<string, { slug: string; target_url: string; title: string | null; description: string | null; image_url: string | null; created_by: string }>();

  return {
    prepare(query: string) {
      let bound: any[] = [];
      return {
        bind(...args: any[]) {
          bound = args;
          return this;
        },
        async first<T>() {
          if (query.includes("SELECT slug FROM urls WHERE slug = ?")) {
            const slug = bound[0];
            return store.has(slug) ? ({ slug } as T) : null;
          }
          if (query.includes("SELECT target_url, title, description, image_url FROM urls WHERE slug = ?")) {
            const slug = bound[0];
            const item = store.get(slug);
            return item ? ({ target_url: item.target_url, title: item.title, description: item.description, image_url: item.image_url } as T) : null;
          }
          return null;
        },
        async run() {
          if (query.includes("INSERT INTO urls")) {
            const [slug, target_url, title, description, image_url, created_by] = bound;
            store.set(slug, { slug, target_url, title, description, image_url, created_by });
          }
          return { success: true, meta: {} };
        }
      };
    }
  } as unknown as D1Database;
}

describe("End-to-End Application Integration", () => {
  const mockDb = createMockD1();
  const env: Env = {
    DB: mockDb,
    API_KEY: "test-secret-key",
    ENVIRONMENT: "test"
  };

  it("GET / serves the Web UI dashboard", async () => {
    const res = await app.request("http://localhost/", {}, env);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Fast, Zero-Cost URL Shortener");
    expect(html).toContain('id="shorten-form"');
  });

  it("GET /api/health returns operational status", async () => {
    const res = await app.request("http://localhost/api/health", {}, env);
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.status).toBe("ok");
    expect(json.environment).toBe("test");
  });

  it("POST /api/shorten creates a short link with custom vanity slug", async () => {
    const res = await app.request(
      "http://localhost/api/shorten",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: "https://github.com/torvalds/linux",
          custom_slug: "linux-kernel",
          title: "Linux Source Code",
          description: "Linux kernel tree"
        })
      },
      env
    );

    expect(res.status).toBe(201);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(json.slug).toBe("linux-kernel");
    expect(json.short_url).toBe("http://localhost/linux-kernel");
    expect(json.metadata.title).toBe("Linux Source Code");
  });

  it("POST /api/shorten rejects duplicate custom slugs with 409 Conflict", async () => {
    const res = await app.request(
      "http://localhost/api/shorten",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: "https://kernel.org",
          custom_slug: "linux-kernel"
        })
      },
      env
    );

    expect(res.status).toBe(409);
    const json = (await res.json()) as any;
    expect(json.error).toContain("already taken");
  });

  it("POST /api/shorten blocks SSRF attempts", async () => {
    const res = await app.request(
      "http://localhost/api/shorten",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: "http://127.0.0.1:8080/internal-secrets"
        })
      },
      env
    );

    expect(res.status).toBe(400);
    const json = (await res.json()) as any;
    expect(json.error).toContain("private or link-local");
  });

  it("GET /:slug redirects human browsers with HTTP 307 and edge cache headers", async () => {
    const res = await app.request(
      "http://localhost/linux-kernel",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0"
        }
      },
      env
    );

    expect(res.status).toBe(307);
    expect(res.headers.get("Location")).toBe("https://github.com/torvalds/linux");
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=86400");
  });

  it("GET /:slug intercepts crawler bots with HTTP 200 and OpenGraph tags", async () => {
    const res = await app.request(
      "http://localhost/linux-kernel",
      {
        headers: {
          "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"
        }
      },
      env
    );

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('property="og:title" content="Linux Source Code"');
    expect(html).toContain('property="og:description" content="Linux kernel tree"');
    expect(html).toContain('<meta http-equiv="refresh" content="0; url=https://github.com/torvalds/linux">');
  });

  it("GET /:slug returns 404 for nonexistent slugs", async () => {
    const res = await app.request("http://localhost/nonexistent-slug-123", {}, env);
    expect(res.status).toBe(404);
  });
});
