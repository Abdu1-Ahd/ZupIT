-- Cloudflare D1 URL Shortener Database Schema
-- Clustered WITHOUT ROWID: 0 duplicate index overhead, human-readable UTF-8 columns
CREATE TABLE IF NOT EXISTS urls (
    slug TEXT PRIMARY KEY,
    target_url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    image_url TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    created_by TEXT DEFAULT 'public'
) WITHOUT ROWID;
