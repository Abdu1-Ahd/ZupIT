import { describe, it, expect } from "vitest";

describe("Live Cloudflare Deployment Verification", () => {
  const pagesUrl = "https://zupit.pages.dev";
  const workerUrl = "https://zup.zawiars.workers.dev";

  it("Worker backend health check responds with 200 OK", async () => {
    const res = await fetch(`${workerUrl}/api/health`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.status).toBe("ok");
    expect(body.environment).toBe("production");
  });

  it("Pages frontend serves UI dashboard via edge functions", async () => {
    const res = await fetch(pagesUrl);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Fast, Zero-Cost URL Shortener");
    expect(html).toContain('id="shorten-form"');
  });

  it("Pages frontend proxies /api/shorten and generates short URL with zupit.pages.dev origin", async () => {
    const testSlug = "test-" + Math.random().toString(36).substring(2, 8);
    const res = await fetch(`${pagesUrl}/api/shorten`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: "https://news.ycombinator.com",
        custom_slug: testSlug,
        title: "Hacker News",
        description: "Tech news aggregator"
      })
    });

    expect(res.status).toBe(201);
    const data = (await res.json()) as any;
    expect(data.success).toBe(true);
    expect(data.slug).toBe(testSlug);
    expect(data.short_url).toBe(`${pagesUrl}/${testSlug}`);

    // Verify redirection
    const redirectRes = await fetch(data.short_url, { redirect: "manual" });
    expect(redirectRes.status).toBe(307);
    expect(redirectRes.headers.get("location")).toBe("https://news.ycombinator.com");
  });
});

