# Implementation Plan: Cloudflare Edge URL Shortener

## 1. Objectives & Scope
Build a custom, zero-operating-cost ($0) URL shortener deployed as a Cloudflare Worker using Hono and Cloudflare D1 (serverless SQLite). The system must provide:
- Instant redirects (<20ms TTFB) for human users.
- Rich social preview rendering (OpenGraph / Twitter card metadata) for social media crawlers (WhatsApp, Discord, Twitter/X, LinkedIn, Telegram).
- Dual access: A responsive web UI at `/` and a developer REST API at `POST /api/shorten`.
- Compact 4-character Base62 slugs (~14.7M combinations) with collision handling.
- Robust SSRF protection blocking scraping of internal/private subnets and loopback addresses.

## 2. Technical Stack
- **Runtime:** Cloudflare Workers (V8 Isolates, 0ms cold starts).
- **Framework:** Hono v4 (Lightweight, zero-overhead edge router).
- **Database:** Cloudflare D1 (Distributed SQLite, 5M reads/day, 100k writes/day free).
- **Language:** TypeScript (strict mode).
- **Parsing:** Native streaming `HTMLRewriter` for OpenGraph metadata extraction without buffering full web pages.

## 3. File Manifest
- `wrangler.jsonc` — Worker configuration & D1 binding.
- `schema.sql` — D1 SQLite table creation and indexes.
- `src/types.ts` — TypeScript types & environment bindings.
- `src/bot.ts` — Crawler detection and OpenGraph HTML rendering.
- `src/ssrf.ts` — SSRF IP & protocol validation.
- `src/scraper.ts` — Streaming HTMLRewriter metadata extraction.
- `src/slug.ts` — Cryptographically secure Base62 slug generator.
- `src/ui.ts` — Embedded single-page application UI.
- `src/index.ts` — Hono app with dual access endpoints.
- `test/unit.test.ts` — Unit test suite.

