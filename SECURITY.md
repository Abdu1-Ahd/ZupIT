# Security & Access Architecture Document (SECURITY.md)

| Metadata | Value |
| :--- | :--- |
| **System** | Edge URL Shortener |
| **Version** | 1.0 (Production Security Architecture) |
| **Classification** | Security Policy & Threat Model |
| **Target Runtime** | Cloudflare Workers & Cloudflare D1 |

---

## 1. User Roles & Access Control (RBAC)

The Edge URL Shortener enforces a least-privilege, multi-tier Role-Based Access Control model.

```
┌─────────────────────────────────────────────────────────────┐
│                      ROLE HIERARCHY                         │
├─────────────────────────────────────────────────────────────┤
│ 1. System Administrator  (Full D1, Secrets, Deployments)    │
│    ▲                                                        │
│ 2. Developer / API User  (Programmatic link creation, auth) │
│    ▲                                                        │
│ 3. Anonymous Public User (Web UI creation, rate-limited)    │
│    ▲                                                        │
│ 4. Link Visitor / Bot    (Read-only 307 redirect / OG card) │
└─────────────────────────────────────────────────────────────┘
```

| Role | Identity Mechanism | Permissions & Scopes | Restricted Actions |
| :--- | :--- | :--- | :--- |
| **Link Visitor / Bot** | Anonymous HTTP Client / Crawler Bot | `GET /:slug`, `GET /` | Cannot create links, view D1, or invoke API endpoints. |
| **Anonymous Public User** | Unauthenticated Browser User | `GET /`, `POST /api/shorten` (Public rate-limited tier) | Cannot delete links, view analytics, or inspect database tables. |
| **Developer / API User** | `Authorization: Bearer <API_KEY>` | `POST /api/shorten` (Higher rate limits, scriptable) | Cannot modify database schemas, alter secrets, or redeploy workers. |
| **System Administrator** | Cloudflare IAM (MFA / SSO + API Token) | Full access to D1 SQL console, Worker secrets, DNS, and CI/CD | Bound by Cloudflare zero-trust session timeouts. |

---

## 2. Who Can Access the System (Access Boundaries)

1. **Public Ingress (Internet-Facing):**
   * `GET /`: Serves the static Web UI. Open to global internet traffic.
   * `GET /:slug`: Redirection and social card delivery endpoint. Accessible by all human browsers and crawler bots.
   * `GET /api/health`: Health monitoring endpoint. Returns operational status without exposing environment secrets.
2. **Protected API Ingress:**
   * `POST /api/shorten`: Conditional barrier. When `c.env.API_KEY` is provisioned, incoming requests must supply a valid Bearer token.
3. **Internal Data & Administrative Layer (Isolated):**
   * **No Open Ports:** Cloudflare D1 does not expose a public TCP port, socket, or IP address.
   * **Binding-Only Access:** The database can only be queried via the internal `DB` binding injected directly into the V8 isolate by the Cloudflare hypervisor.
   * **Administrative Access:** Database modifications and migrations require authenticated Wrangler CLI sessions or Cloudflare dashboard credentials protected by Hardware Security Keys (FIDO2) or TOTP.

---

## 3. API Security & Threat Mitigation

### 3.1 Server-Side Request Forgery (SSRF) Defense
When shortening a link, the system server-side fetches the target URL's `<head>` to extract OpenGraph metadata. To prevent attackers from using the Worker as an internal network proxy:
* **Protocol Whitelisting:** Enforces `http:` or `https:`. Rejects `file:`, `gopher:`, `ftp:`, and `javascript:`.
* **Private IP & Loopback Blocking:** Evaluates hostnames and IP addresses against:
  * `127.0.0.0/8` and `::1` (IPv4 / IPv6 Loopbacks)
  * `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` (RFC 1918 Private subnets)
  * `169.254.0.0/16` and `fe80::/10` (Link-local cloud metadata addresses)
  * `*.local`, `*.internal`, `metadata.google.internal` (Internal DNS names)
* **Abort Budget:** Scraper connections timeout aggressively after 2.5 seconds via `AbortController` to prevent Slowloris resource exhaustion.

### 3.2 Cross-Site Scripting (XSS) Prevention
* Metadata extracted from untrusted third-party websites (`title`, `description`, `image_url`) is sanitized using HTML entity encoding (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#039;`) before being injected into the OpenGraph preview payload.
* The application emits strict `Content-Type: text/html; charset=utf-8` headers.

### 3.3 Cross-Origin Resource Sharing (CORS)
* The `/api/*` endpoints employ Hono CORS middleware allowing preflight `OPTIONS` validation while restricting unsafe HTTP verbs.

---

## 4. Rate Limiting & Denial of Service (DDoS) Defense

Cloudflare provides multi-layered volumetric and application-layer defenses natively at the edge:

```
[Incoming Internet Traffic]
            │
            ▼
┌──────────────────────────────────────┐
│ Layer 3/4: Cloudflare Anycast DDoS   │ -> Absorbs multi-terabit SYN/UDP floods
└──────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────┐
│ Layer 7: Cloudflare Edge WAF         │ -> Blocks known malicious bots & scrapers
└──────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────┐
│ Edge Rate Limiter (Rules Engine)    │ -> Restricts POST /api/shorten to 60 req/min/IP
└──────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────┐
│ Cloudflare Turnstile (Anti-Spam)     │ -> Privacy-preserving CAPTCHA for Public UI
└──────────────────────────────────────┘
            │
            ▼
[Cloudflare Worker Application Logic]
```

* **Volumetric Protection:** Unmetered Anycast DDoS mitigation automatically absorbs Layer 3/4 and Layer 7 volumetric attacks across Cloudflare’s 300+ data centers.
* **Public Rate Limits:** Cloudflare WAF Rate Limiting rules restrict `POST /api/shorten` calls to **60 requests per minute per IP address**.
* **Zero-Write Redirection:** The `GET /:slug` endpoint performs zero database writes, rendering database write-starvation attacks impossible during traffic spikes.
* **Bot Defeat:** Optional Cloudflare Turnstile integration on the web UI prevents headless scripts from spamming public short link creation.

---

## 5. Session Management

* **Stateless Architecture:** The application is 100% stateless.
* **Zero Cookie Footprint:** No session cookies (`Set-Cookie`) or tracking identifiers are emitted by the server.
* **Immunity to CSRF:** Because the API relies entirely on explicit JSON bodies and `Authorization: Bearer` headers rather than ambient browser cookies, Cross-Site Request Forgery (CSRF) attacks are architecturally impossible.
* **Immunity to Session Hijacking:** With no session IDs stored in local storage or cookies, there are zero session tokens to steal or leak.

---

## 6. Database Security

### 6.1 SQL Injection (SQLi) Prevention
* **Parameterized Statements Only:** 100% of queries use Cloudflare D1's native prepared statements:
  ```typescript
  // Strictly Enforced Standard:
  db.prepare("SELECT target_url FROM urls WHERE slug = ? LIMIT 1").bind(slug);
  ```
* **Prohibition:** Dynamic string concatenation or template literal query building (e.g. `WHERE slug = '${slug}'`) is strictly forbidden.

### 6.2 Storage Engine Isolation
* **Ephemeral Memory Model:** Cloudflare D1 executes SQLite queries inside sandboxed V8 isolates. Database connections do not persist between separate global requests.
* **Storage Immutability:** D1 data is replicated across Cloudflare’s storage mesh; raw SQLite database files cannot be accessed or downloaded without Cloudflare administrative credentials.

---

## 7. Passwords & Secret Entropy Requirements

### 7.1 Developer API Keys
* **Entropy Standard:** When configuring `API_KEY`, keys must have at least **128 bits of cryptographic entropy** (recommended: 256 bits).
* **Format:** Minimum 32 alphanumeric characters generated via cryptographically secure random sources:
  ```bash
  # Generate production-grade API Key:
  openssl rand -hex 32
  ```
* **Secret Storage:** API keys must never be committed to source control. They are injected as encrypted Cloudflare secrets using Wrangler:
  ```bash
  npx wrangler secret put API_KEY
  ```

### 7.2 Administrator Accounts
* **Multi-Factor Authentication (MFA):** Cloudflare administrator accounts controlling DNS and deployments must enforce hardware security keys (WebAuthn/FIDO2) or authenticator app TOTP.
* **API Tokens:** Cloudflare deploy tokens used in GitHub Actions CI/CD (`CLOUDFLARE_API_TOKEN`) must follow least-privilege scoping:
  * Permissions: `Workers Scripts:Edit`, `D1:Edit`.
  * Account Resources: Restricted solely to the specific URL Shortener project.

---

## 8. Data Encryption Standards

```
Client (Browser / Bot)
       │
       ▼  (TLS 1.3 / HSTS Encrypted in Transit)
Cloudflare Global Edge PoP
       │
       ▼  (Internal Cloudflare Anycast Backbone Encrypted)
Cloudflare D1 SQLite Engine
       │
       ▼  (AES-256 Encrypted at Rest)
Underlying Solid State Storage Disk
```

### 8.1 Encryption in Transit (Data on the Wire)
* **TLS 1.3 / TLS 1.2:** Minimum protocol version TLS 1.2; TLS 1.3 prioritized. Deprecated protocols (TLS 1.0, TLS 1.1, SSLv3) are permanently disabled at the edge.
* **HTTP Strict Transport Security (HSTS):** Enforced across all custom domains:
  ```http
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  ```
* **Automatic HTTPS Rewrites:** All plain HTTP requests are automatically upgraded to HTTPS at Cloudflare edge nodes before reaching the application worker.

### 8.2 Encryption at Rest (Data on Disk)
* **D1 Storage Mesh Encryption:** Cloudflare D1 transparently encrypts all SQLite database tables, indexes, and Write-Ahead Logging (WAL) files at rest using **AES-256**.
* **Key Management:** Encryption keys are managed and rotated through Cloudflare’s Hardware Security Modules (HSMs).

---

## 9. Backup, Disaster Recovery & High Availability

### 9.1 High Availability & Redundancy
* **Anycast Multi-Region Redundancy:** The Worker code is distributed across 300+ data centers worldwide. If a regional data center experiences an outage, Anycast BGP routing automatically routes traffic to the nearest healthy PoP with zero downtime.
* **Edge CDN Fallback:** With `s-maxage=86400` caching on redirects, even temporary D1 storage latency spikes do not impact human link redirection.

### 9.2 Disaster Recovery & Point-in-Time Recovery (PITR)
Cloudflare D1 includes native **Time Travel** point-in-time recovery for the preceding 30 days.

```bash
# 1. Inspect database bookmarks for point-in-time recovery
npx wrangler d1 time-travel info url_shortener_db

# 2. Restore database to a specific bookmark before an accidental deletion or corruption
npx wrangler d1 time-travel restore url_shortener_db --bookmark=<BOOKMARK_ID>
```

### 9.3 Manual Snapshot Playbook
For disaster recovery independent of Cloudflare infrastructure:
```bash
# 1. Export database snapshot to SQL dump
npx wrangler d1 export url_shortener_db --remote --output=backup.sql

# 2. Restore snapshot to fresh or staging database
npx wrangler d1 execute url_shortener_db --remote --file=backup.sql
```

---

## 10. Security Compliance Matrix

| Security Domain | Standard / Mechanism | Implementation Verification |
| :--- | :--- | :--- |
| **SQL Injection** | Parameterized Prepared Statements | Verified in `src/index.ts` (0 raw string interpolations) |
| **SSRF** | Protocol Whitelist + IP Subnet Filtering | 6/6 tests passing in `test/unit.test.ts` |
| **XSS** | HTML Entity Sanitization & Encoding | Verified in `test/unit.test.ts` (`renderCrawlerHtml`) |
| **DDoS** | Cloudflare Anycast Layer 3/4/7 Protection | Native Cloudflare infrastructure |
| **CSRF** | Stateless header-based API (no cookies) | Zero `Set-Cookie` headers emitted |
| **Data in Transit** | TLS 1.3 / HSTS | Edge TLS enforcement |
| **Data at Rest** | AES-256 Encryption | Native Cloudflare D1 storage encryption |
| **Disaster Recovery** | D1 Time Travel (30-day PITR) | Supported via `wrangler d1 time-travel` |
