import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").unique().notNull(),
  budBalance: text("bud_balance").default("0"),
  terpBalance: text("terp_balance").default("0"),
  lastSeenAnnouncementId: integer("last_seen_announcement_id"),
  lastLogin: timestamp("last_login").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const playerStats = pgTable("player_stats", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").unique().notNull(),
  totalHarvests: integer("total_harvests").default(0).notNull(),
  totalBudEarned: text("total_bud_earned").default("0").notNull(),
  totalTerpEarned: text("total_terp_earned").default("0").notNull(),
  rareTerpenesFound: integer("rare_terpenes_found").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const songs = pgTable("songs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  objectPath: text("object_path").notNull(),
  duration: integer("duration").default(0),
  genre: text("genre").default("chill"),
  coverArt: text("cover_art"),
  playCount: integer("play_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const announcementVideos = pgTable("announcement_videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  objectPath: text("object_path").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Seed Bank - Special seeds with custom attributes
export const seedBank = pgTable("seed_bank", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  rarity: text("rarity").notNull().default("common"), // common, uncommon, rare, legendary, mythic
  terpeneProfile: jsonb("terpene_profile").$type<string[]>().default([]),
  effects: jsonb("effects").$type<string[]>().default([]),
  flavorNotes: jsonb("flavor_notes").$type<string[]>().default([]),
  thcRange: text("thc_range").default("15-20%"),
  cbdRange: text("cbd_range").default("0-1%"),
  growthBonus: integer("growth_bonus").default(0), // Percentage bonus to yields
  budPrice: text("bud_price").notNull().default("0"), // Cost in $BUD (FREE for testing)
  imagePath: text("image_path"), // Custom artwork
  glowColor: text("glow_color").default("#a855f7"), // Primary glow color for card
  totalSupply: integer("total_supply"), // null = unlimited
  mintedCount: integer("minted_count").default(0).notNull(),
  maxPerUser: integer("max_per_user").default(1), // limit per wallet, null = unlimited
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User's owned seeds from seed bank
export const userSeeds = pgTable("user_seeds", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull().references(() => users.walletAddress),
  seedId: integer("seed_id").notNull().references(() => seedBank.id),
  quantity: integer("quantity").default(1).notNull(),
  purchasedAt: timestamp("purchased_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, lastLogin: true });
export const insertPlayerStatsSchema = createInsertSchema(playerStats).omit({ id: true, updatedAt: true });
export const insertSongSchema = createInsertSchema(songs).omit({ id: true, createdAt: true, playCount: true });
export const insertAnnouncementVideoSchema = createInsertSchema(announcementVideos).omit({ id: true, createdAt: true });
export const insertSeedBankSchema = createInsertSchema(seedBank).omit({ id: true, createdAt: true, mintedCount: true });
export const insertUserSeedSchema = createInsertSchema(userSeeds).omit({ id: true, purchasedAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type PlayerStats = typeof playerStats.$inferSelect;
export type InsertPlayerStats = z.infer<typeof insertPlayerStatsSchema>;
export type Song = typeof songs.$inferSelect;
export type InsertSong = z.infer<typeof insertSongSchema>;
export type AnnouncementVideo = typeof announcementVideos.$inferSelect;
export type InsertAnnouncementVideo = z.infer<typeof insertAnnouncementVideoSchema>;
export type SeedBankItem = typeof seedBank.$inferSelect;
export type InsertSeedBankItem = z.infer<typeof insertSeedBankSchema>;
export type UserSeed = typeof userSeeds.$inferSelect;
export type InsertUserSeed = z.infer<typeof insertUserSeedSchema>;

// ============================================
// Prediction Market Tables
// ============================================

// $SMOKE token - obtained by burning $BUD, used for predictions
export const smokeBalances = pgTable("smoke_balances", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").unique().notNull(),
  balance: text("balance").default("0").notNull(), // 6 decimals like $BUD
  totalBurned: text("total_burned").default("0").notNull(), // Total $BUD burned for $SMOKE
  totalWon: text("total_won").default("0").notNull(),
  totalLost: text("total_lost").default("0").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Prediction Markets - crypto price predictions
export const predictionMarkets = pgTable("prediction_markets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(), // "Bitcoin price on Feb 2, 2026 at 5pm EST?"
  description: text("description"),
  category: text("category").notNull().default("crypto"), // crypto, sports, politics, custom
  asset: text("asset"), // BTC, SOL, ETH, etc.
  targetPrice: text("target_price"), // Price threshold (e.g., "77250")
  comparison: text("comparison").default("above"), // above, below, between, exactly
  expirationTime: timestamp("expiration_time").notNull(),
  resolutionTime: timestamp("resolution_time"), // When outcome was determined
  outcome: text("outcome"), // "yes", "no", or null if pending
  yesPrice: integer("yes_price").default(50).notNull(), // Current price in cents (0-100)
  noPrice: integer("no_price").default(50).notNull(),
  totalYesShares: text("total_yes_shares").default("0").notNull(),
  totalNoShares: text("total_no_shares").default("0").notNull(),
  totalVolume: text("total_volume").default("0").notNull(),
  status: text("status").default("open").notNull(), // open, closed, resolved, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

// User positions in markets
export const marketPositions = pgTable("market_positions", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  marketId: integer("market_id").notNull().references(() => predictionMarkets.id),
  yesShares: text("yes_shares").default("0").notNull(), // Number of YES shares owned
  noShares: text("no_shares").default("0").notNull(), // Number of NO shares owned
  avgYesPrice: integer("avg_yes_price").default(0), // Average purchase price
  avgNoPrice: integer("avg_no_price").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order history for markets
export const marketOrders = pgTable("market_orders", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  marketId: integer("market_id").notNull().references(() => predictionMarkets.id),
  side: text("side").notNull(), // "yes" or "no"
  action: text("action").notNull(), // "buy" or "sell"
  shares: text("shares").notNull(), // Number of shares
  pricePerShare: integer("price_per_share").notNull(), // Price in cents
  totalCost: text("total_cost").notNull(), // Total $SMOKE spent/received
  createdAt: timestamp("created_at").defaultNow(),
});

// Market Templates - for auto-generating recurring markets
export const marketTemplates = pgTable("market_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // "BTC Hourly", "SOL 15-min", etc.
  titleTemplate: text("title_template").notNull(), // "Bitcoin price on {date} at {time} EST?"
  description: text("description"),
  category: text("category").notNull().default("crypto"),
  asset: text("asset"), // BTC, SOL, ETH
  // Schedule configuration
  scheduleType: text("schedule_type").notNull(), // "hourly", "15min", "daily", "weekly", "once"
  scheduleInterval: integer("schedule_interval").default(1), // Every X intervals
  // Price levels to generate (JSON array of target prices)
  priceLevels: jsonb("price_levels").$type<string[]>().default([]),
  // Initial probability settings
  defaultYesPrice: integer("default_yes_price").default(50),
  // Market duration in minutes
  durationMinutes: integer("duration_minutes").default(60),
  // Whether template is active
  isActive: boolean("is_active").default(true).notNull(),
  // Last time a market was generated from this template
  lastGenerated: timestamp("last_generated"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for prediction market tables
export const insertSmokeBalanceSchema = createInsertSchema(smokeBalances).omit({ id: true, updatedAt: true });
export const insertPredictionMarketSchema = createInsertSchema(predictionMarkets).omit({ id: true, createdAt: true });
export const insertMarketPositionSchema = createInsertSchema(marketPositions).omit({ id: true, updatedAt: true });
export const insertMarketOrderSchema = createInsertSchema(marketOrders).omit({ id: true, createdAt: true });
export const insertMarketTemplateSchema = createInsertSchema(marketTemplates).omit({ id: true, createdAt: true, lastGenerated: true });

// Types for prediction market
export type SmokeBalance = typeof smokeBalances.$inferSelect;
export type InsertSmokeBalance = z.infer<typeof insertSmokeBalanceSchema>;
export type PredictionMarket = typeof predictionMarkets.$inferSelect;
export type InsertPredictionMarket = z.infer<typeof insertPredictionMarketSchema>;
export type MarketPosition = typeof marketPositions.$inferSelect;
export type InsertMarketPosition = z.infer<typeof insertMarketPositionSchema>;
export type MarketOrder = typeof marketOrders.$inferSelect;
export type InsertMarketOrder = z.infer<typeof insertMarketOrderSchema>;
export type MarketTemplate = typeof marketTemplates.$inferSelect;
export type InsertMarketTemplate = z.infer<typeof insertMarketTemplateSchema>;

// ============================================
// Biomass NFT Tables (Dynamic NFT System)
// ============================================

// Biomass NFTs - Harvested plant material as tradeable NFTs
export const biomassNfts = pgTable("biomass_nfts", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").unique(), // Algorand ASA ID (null until minted)
  walletAddress: text("wallet_address").notNull(),
  dna: text("dna").notNull(),
  terpeneProfile: jsonb("terpene_profile").$type<string[]>().default([]),
  qualityScore: integer("quality_score").default(50).notNull(),
  budValue: text("bud_value").default("0").notNull(),
  generation: integer("generation").default(1).notNull(),
  parentAId: integer("parent_a_id"),
  parentBId: integer("parent_b_id"),
  strainName: text("strain_name"),
  rarity: text("rarity").default("common").notNull(),
  thcRange: text("thc_range").default("15-20%"),
  cbdRange: text("cbd_range").default("0-1%"),
  growthBonus: integer("growth_bonus").default(0),
  effects: jsonb("effects").$type<string[]>().default([]),
  flavorNotes: jsonb("flavor_notes").$type<string[]>().default([]),
  breedingCount: integer("breeding_count").default(0).notNull(),
  imageCid: text("image_cid"),
  isBurned: boolean("is_burned").default(false).notNull(),
  harvestTimestamp: timestamp("harvest_timestamp").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Strain Registry - Tracks unique strain discoveries
export const strainRegistry = pgTable("strain_registry", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(),
  dnaSignature: text("dna_signature").unique().notNull(),
  creatorWallet: text("creator_wallet").notNull(),
  terpeneProfile: jsonb("terpene_profile").$type<string[]>().default([]),
  rarity: text("rarity").default("rare").notNull(),
  totalMinted: integer("total_minted").default(1).notNull(),
  baseGrowthBonus: integer("base_growth_bonus").default(10),
  description: text("description"),
  effects: jsonb("effects").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

// Breeding History - Tracks all breeding events
export const breedingHistory = pgTable("breeding_history", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  parentAId: integer("parent_a_id").notNull(),
  parentBId: integer("parent_b_id").notNull(),
  childId: integer("child_id").notNull(),
  budCost: text("bud_cost").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for biomass NFT tables
export const insertBiomassNftSchema = createInsertSchema(biomassNfts).omit({ id: true, createdAt: true, harvestTimestamp: true });
export const insertStrainRegistrySchema = createInsertSchema(strainRegistry).omit({ id: true, createdAt: true });
export const insertBreedingHistorySchema = createInsertSchema(breedingHistory).omit({ id: true, createdAt: true });

// Types for biomass NFT
export type BiomassNft = typeof biomassNfts.$inferSelect;
export type InsertBiomassNft = z.infer<typeof insertBiomassNftSchema>;
export type StrainRegistryItem = typeof strainRegistry.$inferSelect;
export type InsertStrainRegistryItem = z.infer<typeof insertStrainRegistrySchema>;
export type BreedingHistoryItem = typeof breedingHistory.$inferSelect;
export type InsertBreedingHistoryItem = z.infer<typeof insertBreedingHistorySchema>;

// Rarity types for biomass
export type BiomassRarity = "common" | "uncommon" | "rare" | "legendary" | "mythic";

// ============================================
// Types for Game Data (Frontend <-> Backend)
// ============================================
export type PodStatus = "empty" | "planted" | "growing" | "ready_harvest" | "dead";

export interface PodData {
  id: number; // NFT ID or App Local State Index
  status: PodStatus;
  stage: number; // 0-5
  waterCount: number;
  lastWatered: number; // Timestamp
  dna: string; // Hex string
  deficiencies: string[];
  pests: boolean;
}

export interface PlayerState {
  walletAddress: string;
  budBalance: string;
  terpBalance: string;
  pods: PodData[];
}

// ============================================================
// GrowPod Monitor - Custom Error & Performance Tracking System
// ============================================================

// Error events - captures frontend and backend errors
export const monitorErrors = pgTable("monitor_errors", {
  id: serial("id").primaryKey(),
  errorHash: text("error_hash").notNull(), // For grouping similar errors
  message: text("message").notNull(),
  stack: text("stack"),
  type: text("type").notNull().default("error"), // error, unhandledrejection, network
  source: text("source").notNull().default("frontend"), // frontend, backend, blockchain
  walletAddress: text("wallet_address"),
  url: text("url"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  sessionId: text("session_id"),
  count: integer("count").default(1).notNull(),
  firstSeen: timestamp("first_seen").defaultNow(),
  lastSeen: timestamp("last_seen").defaultNow(),
  resolved: boolean("resolved").default(false).notNull(),
});

// Blockchain transaction tracking
export const monitorTransactions = pgTable("monitor_transactions", {
  id: serial("id").primaryKey(),
  txId: text("tx_id"),
  walletAddress: text("wallet_address").notNull(),
  action: text("action").notNull(), // mint_pod, water, harvest, cleanup, breed, etc.
  status: text("status").notNull().default("pending"), // pending, success, failed
  errorMessage: text("error_message"),
  duration: integer("duration"), // ms from start to confirmation
  gasUsed: integer("gas_used"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Performance metrics - page loads, API calls, wallet connections
export const monitorMetrics = pgTable("monitor_metrics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // page_load, api_call, wallet_connect, etc.
  value: integer("value").notNull(), // duration in ms or count
  tags: jsonb("tags").$type<Record<string, string>>(),
  walletAddress: text("wallet_address"),
  sessionId: text("session_id"),
  url: text("url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Session breadcrumbs - user actions leading up to events
export const monitorBreadcrumbs = pgTable("monitor_breadcrumbs", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  walletAddress: text("wallet_address"),
  action: text("action").notNull(), // click, navigate, api_call, wallet_action, etc.
  category: text("category").notNull(), // ui, navigation, blockchain, api
  data: jsonb("data").$type<Record<string, unknown>>(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Health checks / uptime monitoring
export const monitorHealthChecks = pgTable("monitor_health_checks", {
  id: serial("id").primaryKey(),
  endpoint: text("endpoint").notNull(),
  status: text("status").notNull(), // up, down, degraded
  responseTime: integer("response_time"), // ms
  statusCode: integer("status_code"),
  errorMessage: text("error_message"),
  checkedAt: timestamp("checked_at").defaultNow(),
});

// Aggregated daily stats for dashboard
export const monitorDailyStats = pgTable("monitor_daily_stats", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  totalErrors: integer("total_errors").default(0).notNull(),
  uniqueErrors: integer("unique_errors").default(0).notNull(),
  totalTransactions: integer("total_transactions").default(0).notNull(),
  successfulTransactions: integer("successful_transactions").default(0).notNull(),
  failedTransactions: integer("failed_transactions").default(0).notNull(),
  avgTransactionDuration: integer("avg_transaction_duration"),
  activeUsers: integer("active_users").default(0).notNull(),
  pageViews: integer("page_views").default(0).notNull(),
  avgPageLoadTime: integer("avg_page_load_time"),
});

// Insert schemas
export const insertMonitorErrorSchema = createInsertSchema(monitorErrors).omit({ id: true, firstSeen: true, lastSeen: true, count: true });
export const insertMonitorTransactionSchema = createInsertSchema(monitorTransactions).omit({ id: true, createdAt: true });
export const insertMonitorMetricSchema = createInsertSchema(monitorMetrics).omit({ id: true, createdAt: true });
export const insertMonitorBreadcrumbSchema = createInsertSchema(monitorBreadcrumbs).omit({ id: true, timestamp: true });
export const insertMonitorHealthCheckSchema = createInsertSchema(monitorHealthChecks).omit({ id: true, checkedAt: true });

// Types
export type MonitorError = typeof monitorErrors.$inferSelect;
export type InsertMonitorError = z.infer<typeof insertMonitorErrorSchema>;
export type MonitorTransaction = typeof monitorTransactions.$inferSelect;
export type InsertMonitorTransaction = z.infer<typeof insertMonitorTransactionSchema>;
export type MonitorMetric = typeof monitorMetrics.$inferSelect;
export type InsertMonitorMetric = z.infer<typeof insertMonitorMetricSchema>;
export type MonitorBreadcrumb = typeof monitorBreadcrumbs.$inferSelect;
export type InsertMonitorBreadcrumb = z.infer<typeof insertMonitorBreadcrumbSchema>;
export type MonitorHealthCheck = typeof monitorHealthChecks.$inferSelect;
export type InsertMonitorHealthCheck = z.infer<typeof insertMonitorHealthCheckSchema>;
export type MonitorDailyStats = typeof monitorDailyStats.$inferSelect;
