-- Initial schema for GrowPod Empire D1 Database
-- This creates all necessary tables for the application

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT UNIQUE NOT NULL,
  bud_balance TEXT DEFAULT '0',
  terp_balance TEXT DEFAULT '0',
  last_seen_announcement_id INTEGER,
  last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Player stats table for leaderboards
CREATE TABLE IF NOT EXISTS player_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT UNIQUE NOT NULL,
  total_harvests INTEGER DEFAULT 0 NOT NULL,
  total_bud_earned TEXT DEFAULT '0' NOT NULL,
  total_terp_earned TEXT DEFAULT '0' NOT NULL,
  rare_terpenes_found INTEGER DEFAULT 0 NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Songs table for jukebox
CREATE TABLE IF NOT EXISTS songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  object_path TEXT NOT NULL,
  duration INTEGER DEFAULT 0,
  genre TEXT DEFAULT 'chill',
  cover_art TEXT,
  play_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Announcement videos table
CREATE TABLE IF NOT EXISTS announcement_videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  object_path TEXT NOT NULL,
  is_active INTEGER DEFAULT 1 NOT NULL,  -- SQLite uses INTEGER for boolean
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed bank table for premium seeds
CREATE TABLE IF NOT EXISTS seed_bank (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'common',
  terpene_profile TEXT NOT NULL,  -- JSON stored as TEXT
  effects TEXT NOT NULL,  -- JSON stored as TEXT
  flavor_notes TEXT NOT NULL,  -- JSON stored as TEXT
  thc_range TEXT,
  cbd_range TEXT,
  growth_bonus INTEGER DEFAULT 0 NOT NULL,
  bud_price TEXT,
  glow_color TEXT,
  total_supply INTEGER,
  minted_count INTEGER DEFAULT 0 NOT NULL,
  max_per_user INTEGER DEFAULT 1 NOT NULL,
  is_active INTEGER DEFAULT 1 NOT NULL,  -- SQLite uses INTEGER for boolean
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User seeds table for inventory
CREATE TABLE IF NOT EXISTS user_seeds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT NOT NULL,
  seed_id INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL,
  acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seed_id) REFERENCES seed_bank(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_player_stats_wallet ON player_stats(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_seeds_wallet ON user_seeds(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_seeds_seed_id ON user_seeds(seed_id);
CREATE INDEX IF NOT EXISTS idx_seed_bank_active ON seed_bank(is_active);
