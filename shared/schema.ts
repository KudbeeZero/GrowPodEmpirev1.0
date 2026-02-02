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
  budPrice: text("bud_price").notNull().default("1000"), // Cost in $BUD
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

// Insert schemas for prediction market tables
export const insertSmokeBalanceSchema = createInsertSchema(smokeBalances).omit({ id: true, updatedAt: true });
export const insertPredictionMarketSchema = createInsertSchema(predictionMarkets).omit({ id: true, createdAt: true });
export const insertMarketPositionSchema = createInsertSchema(marketPositions).omit({ id: true, updatedAt: true });
export const insertMarketOrderSchema = createInsertSchema(marketOrders).omit({ id: true, createdAt: true });

// Types for prediction market
export type SmokeBalance = typeof smokeBalances.$inferSelect;
export type InsertSmokeBalance = z.infer<typeof insertSmokeBalanceSchema>;
export type PredictionMarket = typeof predictionMarkets.$inferSelect;
export type InsertPredictionMarket = z.infer<typeof insertPredictionMarketSchema>;
export type MarketPosition = typeof marketPositions.$inferSelect;
export type InsertMarketPosition = z.infer<typeof insertMarketPositionSchema>;
export type MarketOrder = typeof marketOrders.$inferSelect;
export type InsertMarketOrder = z.infer<typeof insertMarketOrderSchema>;

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
