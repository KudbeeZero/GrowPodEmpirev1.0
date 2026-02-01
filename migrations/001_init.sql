-- GrowPod Empire - D1 Database Schema
-- Migration 001: Initial Setup
-- Converted from Drizzle ORM PostgreSQL schema

-- ============================================
-- Users Table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT UNIQUE NOT NULL,
  bud_balance TEXT DEFAULT '0',
  terp_balance TEXT DEFAULT '0',
  last_seen_announcement_id INTEGER,
  last_login TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);

-- ============================================
-- Player Stats Table
-- ============================================
CREATE TABLE IF NOT EXISTS player_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT UNIQUE NOT NULL,
  total_harvests INTEGER DEFAULT 0 NOT NULL,
  total_bud_earned TEXT DEFAULT '0' NOT NULL,
  total_terp_earned TEXT DEFAULT '0' NOT NULL,
  rare_terpenes_found INTEGER DEFAULT 0 NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_player_stats_wallet ON player_stats(wallet_address);
CREATE INDEX IF NOT EXISTS idx_player_stats_harvests ON player_stats(total_harvests DESC);
CREATE INDEX IF NOT EXISTS idx_player_stats_bud ON player_stats(CAST(total_bud_earned AS INTEGER) DESC);
CREATE INDEX IF NOT EXISTS idx_player_stats_terp ON player_stats(CAST(total_terp_earned AS INTEGER) DESC);

-- ============================================
-- Songs Table (Jukebox)
-- ============================================
CREATE TABLE IF NOT EXISTS songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  object_path TEXT NOT NULL,
  duration INTEGER DEFAULT 0,
  genre TEXT DEFAULT 'chill',
  cover_art TEXT,
  play_count INTEGER DEFAULT 0 NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- Announcement Videos Table
-- ============================================
CREATE TABLE IF NOT EXISTS announcement_videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  object_path TEXT NOT NULL,
  is_active INTEGER DEFAULT 1 NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcement_videos(is_active);

-- ============================================
-- Seed Bank Table
-- ============================================
CREATE TABLE IF NOT EXISTS seed_bank (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  rarity TEXT DEFAULT 'common' NOT NULL,
  terpene_profile TEXT DEFAULT '[]',
  effects TEXT DEFAULT '[]',
  flavor_notes TEXT DEFAULT '[]',
  thc_range TEXT DEFAULT '15-20%',
  cbd_range TEXT DEFAULT '0-1%',
  growth_bonus INTEGER DEFAULT 0,
  bud_price TEXT DEFAULT '1000' NOT NULL,
  image_path TEXT,
  glow_color TEXT DEFAULT '#a855f7',
  total_supply INTEGER,
  minted_count INTEGER DEFAULT 0 NOT NULL,
  max_per_user INTEGER DEFAULT 1,
  is_active INTEGER DEFAULT 1 NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_seed_bank_active ON seed_bank(is_active);

-- ============================================
-- User Seeds Table
-- ============================================
CREATE TABLE IF NOT EXISTS user_seeds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT NOT NULL,
  seed_id INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL,
  purchased_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (wallet_address) REFERENCES users(wallet_address),
  FOREIGN KEY (seed_id) REFERENCES seed_bank(id)
);

CREATE INDEX IF NOT EXISTS idx_user_seeds_wallet ON user_seeds(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_seeds_seed ON user_seeds(seed_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_seeds_unique ON user_seeds(wallet_address, seed_id);
