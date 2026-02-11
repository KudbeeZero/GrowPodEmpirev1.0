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
  bud_price TEXT DEFAULT '0' NOT NULL,  -- FREE for testing
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
-- Default Test Seeds (FREE for testing)
-- ============================================
INSERT OR IGNORE INTO seed_bank (name, description, rarity, terpene_profile, effects, flavor_notes, thc_range, cbd_range, growth_bonus, bud_price, glow_color, max_per_user)
VALUES
  ('OG Kush', 'A legendary strain with earthy, pine flavors and powerful effects.', 'rare', '["Myrcene","Limonene","Caryophyllene"]', '["Relaxed","Happy","Euphoric"]', '["Pine","Earthy","Woody"]', '20-25%', '0-1%', 15, '0', '#22c55e', 5),
  ('Blue Dream', 'A sativa-dominant hybrid with sweet berry aroma and balanced effects.', 'uncommon', '["Myrcene","Pinene","Caryophyllene"]', '["Creative","Happy","Uplifted"]', '["Blueberry","Sweet","Vanilla"]', '17-24%', '0.1-0.2%', 10, '0', '#3b82f6', 5),
  ('Sour Diesel', 'Fast-acting energizing strain with pungent diesel aroma.', 'rare', '["Caryophyllene","Limonene","Myrcene"]', '["Energetic","Focused","Creative"]', '["Diesel","Citrus","Earthy"]', '19-25%', '0-0.2%', 12, '0', '#eab308', 5),
  ('Purple Haze', 'Classic psychedelic strain with dreamy euphoria and berry notes.', 'legendary', '["Terpinolene","Myrcene","Caryophyllene"]', '["Euphoric","Creative","Uplifted"]', '["Berry","Earthy","Sweet"]', '16-20%', '0-0.1%', 20, '0', '#a855f7', 3),
  ('Northern Lights', 'Pure indica with relaxing full-body effects. Great for sleep.', 'rare', '["Myrcene","Caryophyllene","Pinene"]', '["Relaxed","Sleepy","Happy"]', '["Pine","Earthy","Sweet"]', '16-21%', '0.1-0.3%', 15, '0', '#14b8a6', 5),
  ('Girl Scout Cookies', 'Award-winning hybrid with dessert-like flavors and potent effects.', 'legendary', '["Caryophyllene","Limonene","Humulene"]', '["Euphoric","Relaxed","Creative"]', '["Sweet","Earthy","Mint"]', '25-28%', '0-0.2%', 25, '0', '#ec4899', 2),
  ('Gelato', 'Sweet and creamy strain with colorful buds and balanced high.', 'rare', '["Limonene","Caryophyllene","Linalool"]', '["Happy","Relaxed","Euphoric"]', '["Sweet","Citrus","Creamy"]', '20-25%', '0-0.1%', 18, '0', '#f97316', 5),
  ('Mystery Kush', 'Unknown genetics with surprising effects. Results may vary!', 'common', '["Unknown"]', '["Mysterious"]', '["Unknown"]', '15-25%', '0-2%', 5, '0', '#6b7280', 10);

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

-- ============================================
-- Biomass NFT Tables (Dynamic NFT System)
-- ============================================

-- Biomass NFTs - Harvested plant material as tradeable NFTs
CREATE TABLE IF NOT EXISTS biomass_nfts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER UNIQUE,                    -- Algorand ASA ID (null until minted on-chain)
  wallet_address TEXT NOT NULL,               -- Current owner
  dna TEXT NOT NULL,                          -- DNA hash from plant
  terpene_profile TEXT DEFAULT '[]',          -- JSON array of terpenes
  quality_score INTEGER DEFAULT 50 NOT NULL,  -- 0-100 based on care quality
  bud_value TEXT DEFAULT '0' NOT NULL,        -- Intrinsic $BUD value (6 decimals)
  generation INTEGER DEFAULT 1 NOT NULL,      -- Breeding generation (G1, G2, etc.)
  parent_a_id INTEGER,                        -- Parent Biomass NFT 1 (for bred NFTs)
  parent_b_id INTEGER,                        -- Parent Biomass NFT 2 (for bred NFTs)
  strain_name TEXT,                           -- Auto-generated or custom strain name
  rarity TEXT DEFAULT 'common' NOT NULL,      -- common, uncommon, rare, legendary, mythic
  thc_range TEXT DEFAULT '15-20%',
  cbd_range TEXT DEFAULT '0-1%',
  growth_bonus INTEGER DEFAULT 0,             -- Percentage bonus if used as seed
  effects TEXT DEFAULT '[]',                  -- JSON array of effects
  flavor_notes TEXT DEFAULT '[]',             -- JSON array of flavors
  breeding_count INTEGER DEFAULT 0 NOT NULL,  -- Times used in breeding
  image_cid TEXT,                             -- IPFS CID for generated image
  is_burned INTEGER DEFAULT 0 NOT NULL,       -- 1 if redeemed for $BUD
  harvest_timestamp TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (parent_a_id) REFERENCES biomass_nfts(id),
  FOREIGN KEY (parent_b_id) REFERENCES biomass_nfts(id)
);

CREATE INDEX IF NOT EXISTS idx_biomass_wallet ON biomass_nfts(wallet_address);
CREATE INDEX IF NOT EXISTS idx_biomass_rarity ON biomass_nfts(rarity);
CREATE INDEX IF NOT EXISTS idx_biomass_generation ON biomass_nfts(generation);
CREATE INDEX IF NOT EXISTS idx_biomass_burned ON biomass_nfts(is_burned);

-- Strain Registry - Tracks unique strain discoveries
CREATE TABLE IF NOT EXISTS strain_registry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,                  -- Unique strain name
  dna_signature TEXT UNIQUE NOT NULL,         -- DNA pattern that defines this strain
  creator_wallet TEXT NOT NULL,               -- First breeder to discover
  terpene_profile TEXT DEFAULT '[]',          -- Characteristic terpenes
  rarity TEXT DEFAULT 'rare' NOT NULL,        -- Base rarity of strain
  total_minted INTEGER DEFAULT 1 NOT NULL,    -- How many exist
  base_growth_bonus INTEGER DEFAULT 10,       -- Bonus when planting this strain
  description TEXT,                           -- Strain description
  effects TEXT DEFAULT '[]',                  -- Characteristic effects
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_strain_creator ON strain_registry(creator_wallet);
CREATE INDEX IF NOT EXISTS idx_strain_rarity ON strain_registry(rarity);

-- Breeding History - Tracks all breeding events
CREATE TABLE IF NOT EXISTS breeding_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT NOT NULL,
  parent_a_id INTEGER NOT NULL,
  parent_b_id INTEGER NOT NULL,
  child_id INTEGER NOT NULL,
  bud_cost TEXT NOT NULL,                     -- $BUD burned for breeding
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (parent_a_id) REFERENCES biomass_nfts(id),
  FOREIGN KEY (parent_b_id) REFERENCES biomass_nfts(id),
  FOREIGN KEY (child_id) REFERENCES biomass_nfts(id)
);

CREATE INDEX IF NOT EXISTS idx_breeding_wallet ON breeding_history(wallet_address);
CREATE INDEX IF NOT EXISTS idx_breeding_child ON breeding_history(child_id);
