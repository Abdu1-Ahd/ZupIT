import { describe, it, expect } from "vitest";
import { isSafePublicUrl } from "../src/ssrf";
import { generateRandomSlug, validateCustomSlug } from "../src/slug";
import { isCrawlerBot, renderCrawlerHtml, generateFallbackCardSvg } from "../src/bot";
import { renderIcon, renderWebUi, OLD_MONEY_PALETTE, oldMoneyTheme, themeToCssVariables } from "../src/ui";

describe("SSRF Protection (isSafePublicUrl)", () => {
  it("allows standard public HTTPS and HTTP URLs", () => {
    expect(isSafePublicUrl("https://github.com/torvalds/linux").safe).toBe(true);
    expect(isSafePublicUrl("http://example.com/test?param=1").safe).toBe(true);
  });

  it("blocks non-http protocols", () => {
    expect(isSafePublicUrl("ftp://files.example.com").safe).toBe(false);
    expect(isSafePublicUrl("javascript:alert(1)").safe).toBe(false);
    expect(isSafePublicUrl("file:///etc/passwd").safe).toBe(false);
  });

  it("blocks localhost and private loopback IPs", () => {
    expect(isSafePublicUrl("http://localhost:8080").safe).toBe(false);
    expect(isSafePublicUrl("http://127.0.0.1:3000").safe).toBe(false);
    expect(isSafePublicUrl("http://127.0.1.1").safe).toBe(false);
  });

  it("blocks RFC 1918 private subnets and link-local metadata", () => {
    expect(isSafePublicUrl("http://10.0.0.1").safe).toBe(false);
    expect(isSafePublicUrl("http://192.168.1.1").safe).toBe(false);
    expect(isSafePublicUrl("http://172.16.0.1").safe).toBe(false);
    expect(isSafePublicUrl("http://172.24.1.10").safe).toBe(false);
    expect(isSafePublicUrl("http://169.254.169.254/latest/meta-data/").safe).toBe(false);
  });

  it("blocks internal domains", () => {
    expect(isSafePublicUrl("http://service.internal").safe).toBe(false);
    expect(isSafePublicUrl("http://printer.local").safe).toBe(false);
  });
});

describe("Slug Generator & Validation", () => {
  it("generates 4-character Base62 slugs by default", () => {
    const slug = generateRandomSlug(4);
    expect(slug).toHaveLength(4);
    expect(/^[0-9a-zA-Z]{4}$/.test(slug)).toBe(true);
  });

  it("validates permissible custom slugs", () => {
    expect(validateCustomSlug("my-blog-post").valid).toBe(true);
    expect(validateCustomSlug("docs_v2").valid).toBe(true);
    expect(validateCustomSlug("a").valid).toBe(true);
  });

  it("rejects reserved system keywords", () => {
    expect(validateCustomSlug("api").valid).toBe(false);
    expect(validateCustomSlug("health").valid).toBe(false);
    expect(validateCustomSlug("robots.txt").valid).toBe(false);
  });

  it("rejects illegal characters or invalid lengths", () => {
    expect(validateCustomSlug("has spaces").valid).toBe(false);
    expect(validateCustomSlug("bad/slash").valid).toBe(false);
    expect(validateCustomSlug("").valid).toBe(false);
    expect(validateCustomSlug("a".repeat(33)).valid).toBe(false);
  });
});

describe("Crawler Bot Detection", () => {
  it("identifies social media preview bots", () => {
    expect(isCrawlerBot("Twitterbot/1.0")).toBe(true);
    expect(isCrawlerBot("facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)")).toBe(true);
    expect(isCrawlerBot("Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)")).toBe(true);
    expect(isCrawlerBot("WhatsApp/2.21.12.21 A")).toBe(true);
    expect(isCrawlerBot("TelegramBot (like TwitterBot)")).toBe(true);
    expect(isCrawlerBot("LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)")).toBe(true);
  });

  it("does not flag regular browser user agents", () => {
    expect(isCrawlerBot("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")).toBe(false);
    expect(isCrawlerBot("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15")).toBe(false);
    expect(isCrawlerBot(null)).toBe(false);
    expect(isCrawlerBot("")).toBe(false);
  });
});

describe("Visual Card Previews & Fallback", () => {
  it("generates an SVG data URI when image_url is missing", () => {
    const svgData = generateFallbackCardSvg("Deep Learning Notes", "notes.example.com");
    expect(svgData).toContain("data:image/svg+xml;utf8,");
    expect(decodeURIComponent(svgData)).toContain("Deep Learning Notes");
    expect(decodeURIComponent(svgData)).toContain("notes.example.com");
  });

  it("injects fallback SVG into crawler HTML when target has no thumbnail", () => {
    const html = renderCrawlerHtml({
      targetUrl: "https://example.com/readme",
      title: "My Readme",
      description: "Description here",
      image_url: null
    });

    expect(html).toContain('property="og:image" content="data:image/svg+xml;');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
  });

  it("escapes malicious HTML characters in title and description", () => {
    const html = renderCrawlerHtml({
      targetUrl: "https://example.com",
      title: '"><script>alert(1)</script>',
      description: "Safe & sound",
      image_url: "https://example.com/pic.jpg"
    });

    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain('<meta http-equiv="refresh" content="0; url=https://example.com">');
  });
});

describe("Modular Web UI & Icon System", () => {
  it("renders SVG icons with configurable size and classes", () => {
    const iconSvg = renderIcon("link", { size: 24, className: "custom-class" });
    expect(iconSvg).toContain('width="24"');
    expect(iconSvg).toContain('class="custom-class"');
    expect(iconSvg).toContain("<svg");
  });

  it("assembles complete secure UI document with styles and components", () => {
    const html = renderWebUi();
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Fast, Zero-Cost URL Shortener");
    expect(html).toContain('id="shorten-form"');
    expect(html).toContain('id="url-input"');
    expect(html).toContain('id="btn-submit"');
    expect(html).toContain('id="result-box"');
    expect(html).toContain("novalidate");
    expect(html).toContain("toast-banner");
    expect(html).toContain("copy-toast");
    expect(html).toContain("smooth-accordion");
    expect(html).toContain('id="btn-paste"');
    expect(html).toContain('id="btn-qr"');
    expect(html).toContain('id="history-card"');
    expect(html).toContain("platform-tabs");
    expect(html).toContain(".sr-only");
    expect(html).toContain("⌘K");
    expect(html).not.toContain('id="adv-accordion"');
    expect(html).not.toContain('id="slug-input"');
    expect(html).not.toContain("Developer API");
  });

  it("generates valid zero-dependency SVG QR codes", async () => {
    const { generateQrSvg } = await import("../src/ui/qr");
    const svg = generateQrSvg("https://zupit.pages.dev/xyz123");
    expect(svg).toContain("<svg");
    expect(svg).toContain("<path");
    expect(svg).toContain("xmlns=");
  });
});

describe("Centralized Design System Themes", () => {
  it("exports exact Old Money palette tokens", () => {
    expect(OLD_MONEY_PALETTE.obsidianBlack).toBe("#000000");
    expect(OLD_MONEY_PALETTE.charcoalSlate).toBe("#5e5956");
    expect(OLD_MONEY_PALETTE.stonePewter).toBe("#99948e");
    expect(OLD_MONEY_PALETTE.oxbloodBurgundy).toBe("#5f0e0d");
    expect(OLD_MONEY_PALETTE.alabasterCream).toBe("#f3efe6");
    expect(OLD_MONEY_PALETTE.charcoalCanvas).toBe("#32312f");
  });

  it("generates CSS custom properties matching the active theme", () => {
    const cssVars = themeToCssVariables(oldMoneyTheme);
    expect(cssVars).toContain("--primary: #5f0e0d");
    expect(cssVars).toContain("--text: #f3efe6");
    expect(cssVars).toContain("--border: rgba(153, 148, 142, 0.16)");
  });

  it("injects theme custom properties into the rendered HTML", () => {
    const html = renderWebUi();
    expect(html).toContain("--primary: #5f0e0d");
    expect(html).toContain("--text: #f3efe6");
  });
});
