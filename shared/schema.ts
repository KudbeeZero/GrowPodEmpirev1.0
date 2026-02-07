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

// Types for Game Data (Frontend <-> Backend)
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
// Biomass NFT System - Harvested Plant Records
// ============================================================

// Terpene definitions for the game
export const TERPENES = {
  myrcene: { name: "Myrcene", color: "#22c55e", rarity: "common", effect: "Relaxing" },
  limonene: { name: "Limonene", color: "#eab308", rarity: "common", effect: "Uplifting" },
  pinene: { name: "Pinene", color: "#14b8a6", rarity: "common", effect: "Focus" },
  caryophyllene: { name: "Caryophyllene", color: "#f97316", rarity: "uncommon", effect: "Calming" },
  linalool: { name: "Linalool", color: "#a855f7", rarity: "uncommon", effect: "Soothing" },
  humulene: { name: "Humulene", color: "#84cc16", rarity: "uncommon", effect: "Appetite Control" },
  terpinolene: { name: "Terpinolene", color: "#ec4899", rarity: "rare", effect: "Creative" },
  ocimene: { name: "Ocimene", color: "#06b6d4", rarity: "rare", effect: "Energizing" },
  bisabolol: { name: "Bisabolol", color: "#f472b6", rarity: "epic", effect: "Healing" },
  geraniol: { name: "Geraniol", color: "#fb7185", rarity: "epic", effect: "Euphoric" },
  valencene: { name: "Valencene", color: "#fbbf24", rarity: "legendary", effect: "Transcendent" },
} as const;

export type TerpeneName = keyof typeof TERPENES;

// Biomass NFT - Created on each harvest
export const harvestedBiomass = pgTable("harvested_biomass", {
  id: serial("id").primaryKey(),
  nftId: text("nft_id").unique().notNull(), // Unique identifier like "BIO-00001"
  walletAddress: text("wallet_address").notNull(),

  // Core value
  budValue: text("bud_value").notNull(), // $BUD value at harvest (with 6 decimals)
  biomassGrams: text("biomass_grams").notNull(), // Weight in grams (e.g., "2.5")

  // Grow data captured at harvest
  strainDna: text("strain_dna").notNull(), // DNA hash from the grow
  terpeneProfile: jsonb("terpene_profile").$type<{ name: string; percentage: number }[]>().default([]),
  dominantTerpene: text("dominant_terpene"), // Primary terpene

  // Care quality metrics
  waterCount: integer("water_count").default(0).notNull(),
  nutrientCount: integer("nutrient_count").default(0).notNull(),
  careScore: integer("care_score").default(0).notNull(), // 0-100 based on care quality

  // Calculated attributes
  potency: integer("potency").default(0).notNull(), // 0-100
  quality: text("quality").notNull().default("standard"), // standard, premium, exotic, legendary
  rarity: text("rarity").notNull().default("common"), // common, uncommon, rare, epic, legendary

  // Visual/Display
  glowColor: text("glow_color").default("#22c55e"), // Based on dominant terpene

  // Origin tracking
  seedId: integer("seed_id"), // If grown from premium seed
  podId: integer("pod_id").notNull(), // Which pod it came from

  // Timestamps
  plantedAt: timestamp("planted_at"),
  harvestedAt: timestamp("harvested_at").defaultNow(),

  // For future combining feature
  isConsumed: boolean("is_consumed").default(false).notNull(), // True if used in breeding
  parentBiomassIds: jsonb("parent_biomass_ids").$type<number[]>(), // If this was created from combining
});

// Custom strains created by combining biomass
export const customStrains = pgTable("custom_strains", {
  id: serial("id").primaryKey(),
  strainId: text("strain_id").unique().notNull(), // Unique like "STRAIN-00001"
  walletAddress: text("wallet_address").notNull(),
  name: text("name").notNull(), // User-given name

  // Genetics
  dnaHash: text("dna_hash").notNull(), // Combined DNA
  terpeneProfile: jsonb("terpene_profile").$type<{ name: string; percentage: number }[]>().default([]),
  dominantTerpene: text("dominant_terpene"),

  // Stats inherited from parents
  avgPotency: integer("avg_potency").default(0).notNull(),
  avgQuality: text("avg_quality").default("standard"),
  rarity: text("rarity").notNull().default("rare"), // Minimum rare since it's custom

  // Parent tracking
  parentBiomassId1: integer("parent_biomass_id_1").notNull(),
  parentBiomassId2: integer("parent_biomass_id_2").notNull(),

  // Visual
  glowColor: text("glow_color").default("#a855f7"),

  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertHarvestedBiomassSchema = createInsertSchema(harvestedBiomass).omit({
  id: true,
  harvestedAt: true,
  isConsumed: true,
});
export const insertCustomStrainSchema = createInsertSchema(customStrains).omit({
  id: true,
  createdAt: true
});

// Types
export type HarvestedBiomass = typeof harvestedBiomass.$inferSelect;
export type InsertHarvestedBiomass = z.infer<typeof insertHarvestedBiomassSchema>;
export type CustomStrain = typeof customStrains.$inferSelect;
export type InsertCustomStrain = z.infer<typeof insertCustomStrainSchema>;

// Helper type for biomass card display
export interface BiomassCardData {
  id: number;
  nftId: string;
  budValue: string;
  biomassGrams: string;
  strainDna: string;
  terpeneProfile: { name: string; percentage: number }[];
  dominantTerpene: string | null;
  waterCount: number;
  nutrientCount: number;
  careScore: number;
  potency: number;
  quality: string;
  rarity: string;
  glowColor: string;
  harvestedAt: Date | null;
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
