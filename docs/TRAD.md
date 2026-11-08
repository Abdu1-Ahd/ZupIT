# Technical Requirement and Architectural Document (TRAD)
## Edge URL Shortener V1

| Metadata | Value |
| :--- | :--- |
| **System** | Edge URL Shortener |
| **Document Version** | 1.0 (Production Architecture) |
| **Author** | Senior Backend Architect |
| **Status** | Approved & Grounded in `PRD.md` |
| **Runtime Target** | Cloudflare Workers (V8 Isolates) + Cloudflare D1 (SQLite) |

---

## 1. System Overview & Architecture

### 1.1 Architectural Objectives & Constraints
* **$0 Operational Cost:** Operates exclusively within permanently free tiers (Cloudflare Workers 100k req/day; D1 5 GB storage, 5M reads/day, 100k writes/day). No credit card required.
* **Sub-10ms Latency:** Leverages Cloudflare’s global Anycast network (300+ PoPs) with CDN Edge caching to resolve redirects directly out of edge RAM.
* **Crawler Metadata Proxying:** Evaluates User-Agent headers to deliver rich OpenGraph preview cards to social media bots without compromising human redirect latency.
* **Long-Term Stability & Simplicity:** Zero containers to patch, zero virtual machines to maintain, zero database sleep states, and zero heavy dependencies.

### 1.2 High-Level Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Clients["Clients & Crawlers"]
        Human["Human Browser (Chrome, Safari, Mobile)"]
        Bot["Social Crawler Bot (WhatsApp, Discord, X, LinkedIn)"]
        Dev["Developer Script / API Client"]
    end

    subgraph Edge["Cloudflare Global Anycast Edge (300+ PoPs)"]
        CDN["Cloudflare CDN & Cache API (caches.default)"]
        Worker["Cloudflare Worker (Hono Router)"]
        
        subgraph WorkerPipes["Worker Execution Pipeline"]
            SSRF["SSRF & Protocol Guard"]
            Scraper["Streaming HTMLRewriter Scraper"]
            SVGFallback["Dynamic SVG Fallback Generator"]
            SlugGen["Base62 Slug Engine"]
        end
    end

    subgraph Storage["Persistence Layer"]
        D1[("Cloudflare D1 SQLite (WITHOUT ROWID)")]
    end

    subgraph External["External World"]
        TargetHost["Destination Web Server (<head> metadata)"]
    end

    %% Human Visit Path
    Human -->|GET /:slug| CDN
    CDN -->|Cache Hit: HTTP 307 (<10ms)| Human
    CDN -->|Cache Miss| Worker
    Worker -->|Single B-Tree Read| D1
    Worker -->|Cache 307 for 24h| CDN
    Worker -->|HTTP 307 Redirect| Human

    %% Bot Visit Path
    Bot -->|GET /:slug (Bot UA)| Worker
    Worker -->|Check Cache API| CDN
    CDN -.->|Cache Miss| Worker
    Worker -->|Fetch Metadata| TargetHost
    Worker -->|Store 200 HTML for 7d| CDN
    Worker -->|HTTP 200 OK + OG Tags| Bot

    %% Developer / UI Shorten Path
    Dev -->|POST /api/shorten| Worker
    Worker --> SSRF
    SSRF --> Scraper
    Scraper --> TargetHost
    Worker --> SlugGen
    SlugGen -->|INSERT INTO urls| D1
    Worker -->|201 Created JSON| Dev
```

### 1.3 System Boundaries
* **In-Scope Boundary:** Worker routing, edge caching, Base62 slug allocation, SSRF validation, target `<head>` streaming extraction, dynamic SVG card generation, and D1 SQLite operations.
* **External Boundary:** Destination websites (third-party servers where links resolve) and external crawler bots.
* **Hard Boundary Invariant:** The Worker will never download binary files (images, videos, executables) or execute client-side JavaScript from target URLs.

---

## 2. Tech Stack & External Dependencies

| Layer | Selected Technology | Version | Rationale & Trade-Offs |
| :--- | :--- | :--- | :--- |
| **Runtime** | Cloudflare Workers (V8 Isolates) | `v4.2025+` | 0ms cold starts globally; runs on physical edge closest to user; permanently free tier (100k requests/day). |
| **Web Framework** | Hono | `^4.7.2` | Minimal footprint (<15 KB bundle), zero external dependencies, native TypeScript bindings for Workers. |
| **Database** | Cloudflare D1 | Engine: SQLite 3 | Serverless, globally distributed SQLite. 5 GB free storage; zero sleep states (unlike Supabase/Render free tiers). |
| **HTML Parser** | Cloudflare `HTMLRewriter` | Native Global | Streaming C++ HTML parser built into V8 runtime. Extracts `<meta>` tags without buffering the full page into RAM. |
| **Language** | TypeScript | `^5.8.2` | Strict type safety across database bindings, request envelopes, and environment interfaces. |
| **Test Runner** | Vitest | `^3.0.7` | Fast ESM runner for unit testing and end-to-end Hono HTTP integration testing. |
| **CLI / Deployer**| Wrangler | `^4.158.0` | Official Cloudflare developer toolkit for local D1 SQLite emulation and global atomic deployments. |

### Dependency Discipline
* **Zero ORMs:** No Prisma, Drizzle, or Kysely. Direct, parameterized SQL queries via native `db.prepare().bind()` guarantee zero runtime weight and zero query overhead.
* **Zero Headless Browsers:** No Puppeteer or Playwright. HTML metadata is parsed strictly via streaming HTTP requests with a 2.5s abort timeout.

---

## 3. Component Responsibilities

### 3.1 Frontend Responsibilities (`src/ui.ts`)
* **Zero-Build Delivery:** Serves pure, self-contained HTML/CSS/JavaScript directly from the Worker root (`GET /`).
* **Client-Side Form Validation:** Enforces URL format compliance before dispatching network calls.
* **Live Social Card Emulator:** Updates a DOM preview card showing the user how WhatsApp, Discord, or X will render the shortened link.
* **Clipboard Interaction:** Native `navigator.clipboard` integration with visual feedback.

### 3.2 Backend Responsibilities
* **`src/index.ts` (Application Orchestrator):**
  * HTTP routing, CORS middleware, Bearer token authorization checks, and lifecycle error handling.
  * User-Agent sniffing and route splitting between human redirects and social crawler payloads.
* **`src/ssrf.ts` (Network Boundary Security):**
  * Parses and verifies target URL protocol (`http:`, `https:`).
  * Validates destination IP/hostname against loopback (`127.0.0.0/8`, `::1`), private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and link-local cloud metadata (`169.254.169.254`).
* **`src/scraper.ts` (Metadata Extraction Engine):**
  * Issues streaming `GET` requests to target URLs with a strict 2.5-second `AbortController` timeout.
  * Hooks into `<head>` elements via `HTMLRewriter` to extract `og:title`, `og:description`, and `og:image`.
* **`src/bot.ts` (Social Proxy & Fallback Engine):**
  * Regex matching for crawler User-Agents.
  * Renders HTML payload containing complete OpenGraph/Twitter meta tags and client-side refresh triggers.
  * Dynamically generates an in-memory 1200x630 SVG fallback data URI when destination sites have no thumbnail image.
* **`src/slug.ts` (Slug Allocation Engine):**
  * Generates 4-character Base62 random strings using `crypto.getRandomValues`.
  * Validates custom vanity slugs against regex rules and system reserved keywords.

---

## 4. Codebase, File & Folder Structure

```
URL Shortener/
├── .gitignore                   # Excludes node_modules, .wrangler local state, and secrets
├── package.json                 # Project manifest, dependencies, and test/migration scripts
├── tsconfig.json                # Strict TypeScript configuration targeting Workers ESNext
├── wrangler.jsonc               # Cloudflare Worker configuration, D1 database binding, and env vars
├── schema.sql                   # Clustered WITHOUT ROWID D1 SQLite table definition
├── PRD.md                       # Product Requirement Document
├── TRAD.md                      # Technical Requirement and Architectural Document
├── src/
│   ├── index.ts                 # Hono router entrypoint, API routes, and redirect handler
│   ├── types.ts                 # D1 database bindings, request/response models, and environment types
│   ├── ssrf.ts                  # Security validator blocking internal/private subnets and loopbacks
│   ├── slug.ts                  # Base62 generator, custom slug validator, and reserved words
│   ├── scraper.ts               # Streaming HTMLRewriter OpenGraph/Twitter metadata extractor
│   ├── bot.ts                   # Crawler bot detection, HTML card rendering, and SVG fallback
│   └── ui.ts                    # Embedded HTML/CSS/JS dashboard template
└── test/
    ├── unit.test.ts             # Unit tests for SSRF, slug generation, bot detection, and SVG output
    └── integration.test.ts      # End-to-end integration tests (Hono request lifecycle with D1 mock)
```

---

## 5. Authentication, Roles & Authorization

### 5.1 Authentication Mechanism
* **Public Web Interface (`GET /` & `POST /api/shorten`):** Open access for interactive users without requiring login accounts or passwords.
* **Developer REST API (`POST /api/shorten`):** Protected by a static Bearer Token mechanism.
  * When `c.env.API_KEY` is configured in Cloudflare Secrets, incoming requests bearing an `Authorization` header must match:
    $$\text{Token} == \text{c.env.API_KEY}$$
  * If invalid, the endpoint responds with `HTTP 401 Unauthorized`.
  * If valid, request is recorded with `created_by = 'api'`.

### 5.2 Rate Limiting & Abuse Defense
* Cloudflare edge platform provides native DDoS and L7 request rate limiting.
* High-volume public attacks are mitigated by Cloudflare’s free Anycast edge and Turnstile integration points without adding stateful rate-limiting database overhead.

---

## 6. Database Architecture & Schema

### 6.1 Database Engine & Model
The system uses **Cloudflare D1** (Serverless SQLite 3). The schema is optimized for ultra-fast, single B-tree lookups using SQLite's clustered `WITHOUT ROWID` optimization.

```sql
-- schema.sql
CREATE TABLE IF NOT EXISTS urls (
    slug TEXT PRIMARY KEY,
    target_url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    image_url TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    created_by TEXT DEFAULT 'public'
) WITHOUT ROWID;
```

### 6.2 Schema Properties & Optimization Details
* **`slug TEXT PRIMARY KEY ... WITHOUT ROWID`:** Eliminates the hidden 64-bit `rowid` column and avoids secondary index duplication. The primary table *is* the B-tree indexed directly by `slug`. Lookups require 1 disk seek instead of 2.
* **`created_at INTEGER DEFAULT (unixepoch())`:** Stored as a 4-byte Unix timestamp integer rather than a 20-byte `DATETIME` string.
* **Storage Footprint:** Each record consumes ~440 bytes. The 5 GB free D1 quota accommodates **11.2 million shortened URLs**.

### 6.3 Migration Strategy
Migrations are managed declaratively using Wrangler:
```bash
# Local development migration
wrangler d1 execute DB --local --file=./schema.sql

# Production edge migration
wrangler d1 execute DB --remote --file=./schema.sql
```

---

## 7. API & Integration Specifications

### 7.1 Protocol & Base URL
* **Protocol:** HTTP/2 & HTTP/3 over TLS 1.3.
* **Base URL:** `https://<worker-domain>/api`
* **Content-Type:** `application/json`

### 7.2 Endpoints Specification

#### 1. Health Check
* **Route:** `GET /api/health`
* **Response (`200 OK`):**
  ```json
  {
    "status": "ok",
    "environment": "production",
    "timestamp": "2026-11-08T09:00:00.000Z"
  }
  ```

#### 2. Shorten URL
* **Route:** `POST /api/shorten`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer <API_KEY>` (Optional/Configurable)
* **Request Schema:**
  ```json
  {
    "url": "https://github.com/torvalds/linux",
    "custom_slug": "linux-kernel",
    "title": "Linux Source Code",
    "description": "The official Linux kernel tree",
    "image_url": "https://example.com/custom-thumb.png"
  }
  ```
* **Response (`201 Created`):**
  ```json
  {
    "success": true,
    "slug": "linux-kernel",
    "short_url": "https://s.yourdomain.workers.dev/linux-kernel",
    "target_url": "https://github.com/torvalds/linux",
    "metadata": {
      "title": "Linux Source Code",
      "description": "The official Linux kernel tree",
      "image_url": "https://example.com/custom-thumb.png"
    }
  }
  ```
* **Error Responses:**
  * `400 Bad Request`: `{"error": "A valid 'url' string field is required"}` or `{"error": "Access to private or link-local IP addresses is prohibited"}`.
  * `401 Unauthorized`: `{"error": "Unauthorized: Invalid API key"}`.
  * `409 Conflict`: `{"error": "The custom slug 'linux-kernel' is already taken"}`.
  * `500 Internal Server Error`: `{"error": "Failed to allocate a unique slug..."}`.

#### 3. Redirection & Social Preview
* **Route:** `GET /:slug`
* **Behavior:**
  * **Human Client (Standard UA):** Returns `HTTP 307 Temporary Redirect` with `Location: <target_url>` and `Cache-Control: public, max-age=300, s-maxage=86400, stale-while-revalidate=604800`.
  * **Social Bot (Crawler UA):** Returns `HTTP 200 OK` with `Content-Type: text/html; charset=utf-8` containing OpenGraph/Twitter card tags and `<meta http-equiv="refresh">`.

---

## 8. Environment & Secrets Management

### 8.1 Configuration Matrix

| Variable / Binding | Type | Development (`local`) | Staging (`preview`) | Production (`remote`) |
| :--- | :--- | :--- | :--- | :--- |
| `DB` | D1 Database Binding | Local SQLite file (`.wrangler/state`) | Cloudflare D1 Preview DB | Cloudflare D1 Production DB |
| `ENVIRONMENT` | String Variable | `"development"` | `"staging"` | `"production"` |
| `API_KEY` | Encrypted Secret | Plain text in `wrangler.jsonc` | Staging Worker Secret | Production Secret via `wrangler secret` |

### 8.2 Production Secret Ingestion
Secrets are injected into the Cloudflare Worker runtime via Wrangler's encrypted key vault:
```bash
npx wrangler secret put API_KEY
```
Secrets are never checked into version control or logged to the console.

---

## 9. Deployment & DevOps Pipeline

### 9.1 Hosting Infrastructure
* **Zero Container Overhead:** Compiled into a single JavaScript bundle (<50 KB) executed within V8 isolates across Cloudflare's 300+ global data centers.
* **Atomic Releases:** Cloudflare Worker deployments are atomic. Zero-downtime rolling updates take effect globally within 3 seconds.

### 9.2 Continuous Integration & Deployment (CI/CD) Workflow

```yaml
# .github/workflows/deploy.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: TypeScript Check
        run: npm run build

      - name: Execute Test Suite
        run: npm test

  deploy:
    needs: validate
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Apply D1 Remote Migrations
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: d1 execute DB --remote --file=./schema.sql

      - name: Deploy Worker Globally
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy
```

---

## 10. Scalability & Performance Strategy

### 10.1 Multi-Tier Caching Architecture

```
Layer 1: Browser Cache (Client RAM)
         Cache-Control: public, max-age=300 (5 minutes local retention)
            │
            ▼ (Cache Miss)
Layer 2: Cloudflare Global Edge CDN (300+ Anycast Locations)
         s-maxage=86400 (24-hour retention across regional edge nodes)
         stale-while-revalidate=604800 (Background asynchronous refresh)
         --> Latency: 2ms - 8ms TTFB
            │
            ▼ (Cache Miss)
Layer 3: Cloudflare Edge Cache API (caches.default)
         Stores rendered HTML OpenGraph preview cards for social bots (7 days)
            │
            ▼ (Cache Miss)
Layer 4: Cloudflare D1 Distributed SQLite Engine
         Clustered B-Tree lookup (WITHOUT ROWID)
         --> Latency: ~15ms - 25ms TTFB
```

### 10.2 Database Write & Quota Preservation
* **Zero Per-Click Writes:** The system records **0 database writes** when a link is clicked. Tracking individual clicks in D1 would burn the 100k writes/day free limit during traffic spikes.
* **Aggregate Metrics:** Click metrics can be observed via Cloudflare Web Analytics at the domain edge for free, preserving 100% of D1 write capacity for link generation.

### 10.3 Scaling Limits & Fail-Safe Behavior
* **Request Scaling:** Automatically scales horizontally from 0 to 100,000 requests/day with no manual server provisioning.
* **Fail-Safe Mode:** If an external target site hangs, blocks scrapers, or times out, the scraper aborts within 2.5s and immediately falls back to generating an internal SVG card, preventing thread blocking or cascade timeouts.

