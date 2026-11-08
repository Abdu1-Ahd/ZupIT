# Edge URL Shortener ⚡

> A zero-operating-cost ($0/month), ultra-low-latency URL shortener deployed globally on Cloudflare Workers and Cloudflare D1. Features instant redirects for humans, rich OpenGraph preview cards for social media crawlers, and an embedded responsive web UI.

---

## 🚀 Key Features

* **$0 Forever Operating Cost:** Built entirely on Cloudflare's permanent free tiers (Workers + D1 SQLite). No credit card required, no expiring trial, and no database sleep pauses.
* **Sub-10ms Global Redirection:** HTTP 307 temporary redirects with `Cache-Control: public, s-maxage=86400` caching. Cloudflare's 300+ anycast edge PoPs resolve repeat visits directly from edge RAM.
* **Rich Social Preview Proxying:** Crawlers (WhatsApp, Discord, X/Twitter, LinkedIn, Telegram) receive an HTTP 200 HTML response with complete OpenGraph metadata instead of blank or broken redirect cards.
* **Dynamic SVG Fallback Banners:** Automatically generates an in-memory 1200x630 high-resolution SVG preview card when the destination site lacks an `og:image` (e.g. GitHub Readmes, plain docs).
* **Dual Access:** Clean dark-mode dashboard at `/` for human users, plus a lightweight developer REST API at `POST /api/shorten`.
* **Clustered `WITHOUT ROWID` Storage:** Uses SQLite's clustered index engine directly on `slug` for single B-tree lookups. Accommodates up to **11.2 million shortened links** on the 5 GB free tier.
* **SSRF Protection:** Pre-scrape network validator blocks private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), loopback (`127.0.0.1`), and cloud metadata endpoints (`169.254.169.254`).

---

## 🛠️ Project Structure

```
├── src/
│   ├── index.ts        # Main Hono edge router (UI, API, and redirection)
│   ├── bot.ts          # Social crawler User-Agent detection & HTML card renderer
│   ├── scraper.ts      # Streaming HTMLRewriter OpenGraph metadata extraction
│   ├── ssrf.ts         # Server-Side Request Forgery IP & protocol validator
│   ├── slug.ts         # Cryptographic Base62 slug generation & vanity validation
│   ├── ui.ts           # Embedded single-page application dashboard
│   └── types.ts        # TypeScript interfaces & Cloudflare D1 environment bindings
├── test/
│   ├── unit.test.ts        # Unit tests (SSRF, Slug, Bot detector, SVG card generator)
│   └── integration.test.ts # End-to-end integration tests (Hono app request lifecycle)
├── schema.sql          # D1 SQLite table creation & WITHOUT ROWID configuration
├── wrangler.jsonc      # Cloudflare Worker configuration & D1 database bindings
└── PRD.md              # Formal Product Requirement Document
```

---

## 💻 Local Development

### 1. Prerequisites
* Node.js v18+ (tested on v26)
* npm v9+

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Test Suite
Runs all 22 unit and end-to-end integration tests:
```bash
npm test
```

### 4. Initialize Local D1 Database
Creates the local SQLite database inside `.wrangler/state/`:
```bash
npm run db:migrate:local
```

### 5. Start Local Dev Server
```bash
npm run dev
```
Open [http://localhost:8787](http://localhost:8787) in your browser to access the Web UI.

---

## 🌐 Production Cloudflare Deployment ($0/month)

Deploying globally across Cloudflare's edge network takes less than 2 minutes.

### 1. Authenticate Wrangler
```bash
npx wrangler login
```

### 2. Create the Remote D1 Database
```bash
npx wrangler d1 create url_shortener_db
```
Wrangler will output configuration information similar to:
```jsonc
[[d1_databases]]
binding = "DB"
database_name = "url_shortener_db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 3. Update `wrangler.jsonc`
Open `wrangler.jsonc` and replace the placeholder `database_id` with your actual `database_id`.

### 4. Execute Remote Database Migration
Apply the `schema.sql` table definition to your Cloudflare production D1 database:
```bash
npm run db:migrate:remote
```

### 5. Deploy Globally
```bash
npm run deploy
```
Your service is now live across 300+ data centers at `https://s.<your-subdomain>.workers.dev`.

---

## 🔌 Developer REST API

### Create Short Link
```http
POST /api/shorten
Content-Type: application/json
Authorization: Bearer <API_KEY> (Optional if API_KEY is set in wrangler)
```

#### Request Body
```json
{
  "url": "https://github.com/torvalds/linux",
  "custom_slug": "linux-kernel",      // Optional: 1-32 chars alphanumeric, '-', '_'
  "title": "Custom Preview Title",    // Optional: overrides target site's og:title
  "description": "Custom description", // Optional: overrides target site's og:description
  "image_url": "https://example.com/thumb.jpg" // Optional: overrides target thumbnail
}
```

#### Response (`201 Created`)
```json
{
  "success": true,
  "slug": "linux-kernel",
  "short_url": "https://s.yoursubdomain.workers.dev/linux-kernel",
  "target_url": "https://github.com/torvalds/linux",
  "metadata": {
    "title": "Custom Preview Title",
    "description": "Custom description",
    "image_url": "https://example.com/thumb.jpg"
  }
}
```

#### cURL Example
```bash
curl -X POST https://s.yoursubdomain.workers.dev/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://en.wikipedia.org/wiki/URL_shortening"}'
```

---

## 🏷️ Custom Domains (Optional)

To use your own short domain (e.g. `sho.rt/abc` or free `name.is-a.dev/abc`):
1. In the Cloudflare Dashboard, navigate to **Workers & Pages** -> your Worker (`s`).
2. Go to **Settings** -> **Domains & Routes** -> **Custom Domains**.
3. Add your domain or subdomain (e.g., `s.yourdomain.com` or `sho.rt`).
4. Cloudflare will automatically provision an SSL certificate and route requests directly to your Worker with 0ms overhead.

---

## 📄 License
MIT License. Free to use, fork, and self-host.
