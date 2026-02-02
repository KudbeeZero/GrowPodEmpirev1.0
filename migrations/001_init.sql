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

-- ============================================
-- $SMOKE Balances Table (Prediction Market Currency)
-- ============================================
CREATE TABLE IF NOT EXISTS smoke_balances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT UNIQUE NOT NULL,
  balance TEXT DEFAULT '0' NOT NULL,
  total_burned TEXT DEFAULT '0' NOT NULL,
  total_won TEXT DEFAULT '0' NOT NULL,
  total_lost TEXT DEFAULT '0' NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_smoke_wallet ON smoke_balances(wallet_address);

-- ============================================
-- Prediction Markets Table
-- ============================================
CREATE TABLE IF NOT EXISTS prediction_markets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'crypto' NOT NULL,
  asset TEXT,
  target_price TEXT,
  comparison TEXT DEFAULT 'above',
  expiration_time TEXT NOT NULL,
  resolution_time TEXT,
  outcome TEXT,
  yes_price INTEGER DEFAULT 50 NOT NULL,
  no_price INTEGER DEFAULT 50 NOT NULL,
  total_yes_shares TEXT DEFAULT '0' NOT NULL,
  total_no_shares TEXT DEFAULT '0' NOT NULL,
  total_volume TEXT DEFAULT '0' NOT NULL,
  status TEXT DEFAULT 'open' NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_markets_status ON prediction_markets(status);
CREATE INDEX IF NOT EXISTS idx_markets_category ON prediction_markets(category);
CREATE INDEX IF NOT EXISTS idx_markets_expiration ON prediction_markets(expiration_time);

-- ============================================
-- Market Positions Table
-- ============================================
CREATE TABLE IF NOT EXISTS market_positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT NOT NULL,
  market_id INTEGER NOT NULL,
  yes_shares TEXT DEFAULT '0' NOT NULL,
  no_shares TEXT DEFAULT '0' NOT NULL,
  avg_yes_price INTEGER DEFAULT 0,
  avg_no_price INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (market_id) REFERENCES prediction_markets(id)
);

CREATE INDEX IF NOT EXISTS idx_positions_wallet ON market_positions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_positions_market ON market_positions(market_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_positions_unique ON market_positions(wallet_address, market_id);

-- ============================================
-- Market Orders Table
-- ============================================
CREATE TABLE IF NOT EXISTS market_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT NOT NULL,
  market_id INTEGER NOT NULL,
  side TEXT NOT NULL,
  action TEXT NOT NULL,
  shares TEXT NOT NULL,
  price_per_share INTEGER NOT NULL,
  total_cost TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (market_id) REFERENCES prediction_markets(id)
);

CREATE INDEX IF NOT EXISTS idx_orders_wallet ON market_orders(wallet_address);
CREATE INDEX IF NOT EXISTS idx_orders_market ON market_orders(market_id);

-- ============================================
-- Market Templates Table (for auto-generating markets)
-- ============================================
CREATE TABLE IF NOT EXISTS market_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  title_template TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'crypto' NOT NULL,
  asset TEXT,
  schedule_type TEXT NOT NULL,
  schedule_interval INTEGER DEFAULT 1,
  price_levels TEXT DEFAULT '[]',
  default_yes_price INTEGER DEFAULT 50,
  duration_minutes INTEGER DEFAULT 60,
  is_active INTEGER DEFAULT 1 NOT NULL,
  last_generated TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_templates_active ON market_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_templates_schedule ON market_templates(schedule_type);

-- ============================================
-- Seed default market templates
-- ============================================
INSERT OR IGNORE INTO market_templates (name, title_template, description, category, asset, schedule_type, schedule_interval, price_levels, default_yes_price, duration_minutes)
VALUES
  ('BTC Hourly', 'Bitcoin price on {date} at {time} EST?', 'Predict if BTC will be above the target price', 'crypto', 'BTC', 'hourly', 1, '["95000","96000","97000","98000","99000","100000"]', 50, 60),
  ('BTC 15-min', 'BTC price at {time} EST?', 'Quick 15-minute Bitcoin prediction', 'crypto', 'BTC', '15min', 1, '["95000","96000","97000","98000"]', 50, 15),
  ('SOL Hourly', 'Solana price on {date} at {time} EST?', 'Predict if SOL will be above the target price', 'crypto', 'SOL', 'hourly', 1, '["200","210","220","230","240","250"]', 50, 60),
  ('SOL 15-min', 'SOL price at {time} EST?', 'Quick 15-minute Solana prediction', 'crypto', 'SOL', '15min', 1, '["200","210","220","230"]', 50, 15),
  ('ETH Hourly', 'Ethereum price on {date} at {time} EST?', 'Predict if ETH will be above the target price', 'crypto', 'ETH', 'hourly', 1, '["3000","3100","3200","3300","3400","3500"]', 50, 60),
  ('ALGO Hourly', 'Algorand price on {date} at {time} EST?', 'Predict if ALGO will be above the target price', 'crypto', 'ALGO', 'hourly', 1, '["0.30","0.35","0.40","0.45","0.50"]', 50, 60);
