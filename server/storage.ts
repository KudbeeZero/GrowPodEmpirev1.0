import { users, playerStats, songs, announcementVideos, seedBank, userSeeds, type User, type InsertUser, type PlayerStats, type Song, type InsertSong, type AnnouncementVideo, type InsertAnnouncementVideo, type SeedBankItem, type InsertSeedBankItem, type UserSeed, type InsertUserSeed } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export interface LeaderboardEntry {
  rank: number;
  wallet: string;
  value: number;
  displayValue: string;
  rawValue?: string;
}

export interface IStorage {
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLogin(id: number): Promise<User>;
  updateUserBalances(walletAddress: string, bud: string, terp: string): Promise<User>;
  getOrCreatePlayerStats(walletAddress: string): Promise<PlayerStats>;
  recordHarvest(walletAddress: string, budEarned: string, terpEarned: string, isRareTerp: boolean): Promise<PlayerStats>;
  getHarvestLeaderboard(limit?: number): Promise<LeaderboardEntry[]>;
  getBudLeaderboard(limit?: number): Promise<LeaderboardEntry[]>;
  getTerpLeaderboard(limit?: number): Promise<LeaderboardEntry[]>;
  getGlobalStats(): Promise<{ totalHarvests: number; totalBudMinted: string; totalPlayers: number; rareTerpenesFound: number }>;
  getAllSongs(): Promise<Song[]>;
  getSongById(id: number): Promise<Song | undefined>;
  createSong(song: InsertSong): Promise<Song>;
  deleteSong(id: number): Promise<void>;
  incrementPlayCount(id: number): Promise<Song | undefined>;
  getActiveAnnouncement(): Promise<AnnouncementVideo | undefined>;
  createAnnouncement(video: InsertAnnouncementVideo): Promise<AnnouncementVideo>;
  deactivateAllAnnouncements(): Promise<void>;
  markAnnouncementWatched(walletAddress: string, announcementId: number): Promise<User | undefined>;
  hasUserWatchedAnnouncement(walletAddress: string, announcementId: number): Promise<boolean>;
  // Seed Bank
  getAllSeeds(): Promise<SeedBankItem[]>;
  getSeedById(id: number): Promise<SeedBankItem | undefined>;
  createSeed(seed: InsertSeedBankItem): Promise<SeedBankItem>;
  updateSeed(id: number, seed: Partial<InsertSeedBankItem>): Promise<SeedBankItem | undefined>;
  deleteSeed(id: number): Promise<void>;
  purchaseSeed(walletAddress: string, seedId: number): Promise<UserSeed>;
  getUserSeeds(walletAddress: string): Promise<(UserSeed & { seed: SeedBankItem })[]>;
  getUserSeedCount(walletAddress: string, seedId: number): Promise<number>;
  useUserSeed(walletAddress: string, seedId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  private db: any; // DrizzleD1Database or NodePgDatabase - both have compatible APIs

  constructor(dbInstance?: DrizzleD1Database<any> | NodePgDatabase<any>) {
    this.db = dbInstance || db;
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await this.db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserLogin(id: number): Promise<User> {
    const [user] = await this.db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserBalances(walletAddress: string, bud: string, terp: string): Promise<User> {
    const [user] = await this.db.update(users)
      .set({ budBalance: bud, terpBalance: terp })
      .where(eq(users.walletAddress, walletAddress))
      .returning();
    return user;
  }

  async getOrCreatePlayerStats(walletAddress: string): Promise<PlayerStats> {
    const [existing] = await this.db.select().from(playerStats).where(eq(playerStats.walletAddress, walletAddress));
    if (existing) return existing;
    
    const [stats] = await this.db.insert(playerStats).values({ walletAddress }).returning();
    return stats;
  }

  async recordHarvest(walletAddress: string, budEarned: string, terpEarned: string, isRareTerp: boolean): Promise<PlayerStats> {
    const existing = await this.getOrCreatePlayerStats(walletAddress);
    
    const newBudTotal = (BigInt(existing.totalBudEarned) + BigInt(budEarned)).toString();
    const newTerpTotal = (BigInt(existing.totalTerpEarned) + BigInt(terpEarned)).toString();
    
    const [updated] = await this.db.update(playerStats)
      .set({
        totalHarvests: existing.totalHarvests + 1,
        totalBudEarned: newBudTotal,
        totalTerpEarned: newTerpTotal,
        rareTerpenesFound: isRareTerp ? existing.rareTerpenesFound + 1 : existing.rareTerpenesFound,
        updatedAt: new Date(),
      })
      .where(eq(playerStats.walletAddress, walletAddress))
      .returning();
    
    return updated;
  }

  async getHarvestLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
    const results = await this.db.select()
      .from(playerStats)
      .orderBy(desc(playerStats.totalHarvests))
      .limit(limit);
    
    return results.map((r, idx) => ({
      rank: idx + 1,
      wallet: r.walletAddress,
      value: r.totalHarvests,
      displayValue: r.totalHarvests.toString(),
    }));
  }

  async getBudLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
    const results = await this.db.select()
      .from(playerStats)
      .orderBy(desc(sql`CAST(${playerStats.totalBudEarned} AS NUMERIC)`))
      .limit(limit);
    
    return results.map((r, idx) => ({
      rank: idx + 1,
      wallet: r.walletAddress,
      value: 0,
      displayValue: formatTokenAmount(r.totalBudEarned),
      rawValue: r.totalBudEarned,
    }));
  }

  async getTerpLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
    const results = await this.db.select()
      .from(playerStats)
      .orderBy(desc(sql`CAST(${playerStats.totalTerpEarned} AS NUMERIC)`))
      .limit(limit);
    
    return results.map((r, idx) => ({
      rank: idx + 1,
      wallet: r.walletAddress,
      value: 0,
      displayValue: formatTokenAmount(r.totalTerpEarned),
      rawValue: r.totalTerpEarned,
    }));
  }

  async getGlobalStats(): Promise<{ totalHarvests: number; totalBudMinted: string; totalPlayers: number; rareTerpenesFound: number }> {
    const [stats] = await this.db.select({
      totalHarvests: sql<number>`COALESCE(SUM(${playerStats.totalHarvests}), 0)`,
      totalBudMinted: sql<string>`COALESCE(SUM(CAST(${playerStats.totalBudEarned} AS NUMERIC)), 0)::TEXT`,
      totalPlayers: sql<number>`COUNT(*)`,
      rareTerpenesFound: sql<number>`COALESCE(SUM(${playerStats.rareTerpenesFound}), 0)`,
    }).from(playerStats);
    
    return {
      totalHarvests: Number(stats.totalHarvests) || 0,
      totalBudMinted: stats.totalBudMinted || "0",
      totalPlayers: Number(stats.totalPlayers) || 0,
      rareTerpenesFound: Number(stats.rareTerpenesFound) || 0,
    };
  }

  async getAllSongs(): Promise<Song[]> {
    const results = await this.db.select().from(songs).orderBy(desc(songs.createdAt));
    return results;
  }

  async getSongById(id: number): Promise<Song | undefined> {
    const [song] = await this.db.select().from(songs).where(eq(songs.id, id));
    return song;
  }

  async createSong(song: InsertSong): Promise<Song> {
    const [created] = await this.db.insert(songs).values(song).returning();
    return created;
  }

  async deleteSong(id: number): Promise<void> {
    await this.db.delete(songs).where(eq(songs.id, id));
  }

  async incrementPlayCount(id: number): Promise<Song | undefined> {
    const [updated] = await this.db.update(songs)
      .set({ playCount: sql`${songs.playCount} + 1` })
      .where(eq(songs.id, id))
      .returning();
    return updated;
  }

  async getActiveAnnouncement(): Promise<AnnouncementVideo | undefined> {
    const [video] = await this.db.select()
      .from(announcementVideos)
      .where(eq(announcementVideos.isActive, true))
      .orderBy(desc(announcementVideos.createdAt))
      .limit(1);
    return video;
  }

  async createAnnouncement(video: InsertAnnouncementVideo): Promise<AnnouncementVideo> {
    const [created] = await this.db.insert(announcementVideos).values(video).returning();
    return created;
  }

  async deactivateAllAnnouncements(): Promise<void> {
    await this.db.update(announcementVideos).set({ isActive: false });
  }

  async markAnnouncementWatched(walletAddress: string, announcementId: number): Promise<User | undefined> {
    const [updated] = await this.db.update(users)
      .set({ lastSeenAnnouncementId: announcementId })
      .where(eq(users.walletAddress, walletAddress))
      .returning();
    return updated;
  }

  async hasUserWatchedAnnouncement(walletAddress: string, announcementId: number): Promise<boolean> {
    const user = await this.getUserByWallet(walletAddress);
    if (!user) return false;
    return user.lastSeenAnnouncementId === announcementId;
  }

  // Seed Bank methods
  async getAllSeeds(): Promise<SeedBankItem[]> {
    const results = await this.db.select().from(seedBank).where(eq(seedBank.isActive, true)).orderBy(desc(seedBank.createdAt));
    return results;
  }

  async getSeedById(id: number): Promise<SeedBankItem | undefined> {
    const [seed] = await this.db.select().from(seedBank).where(eq(seedBank.id, id));
    return seed;
  }

  async createSeed(seed: InsertSeedBankItem): Promise<SeedBankItem> {
    const [created] = await this.db.insert(seedBank).values(seed as any).returning();
    return created;
  }

  async updateSeed(id: number, seed: Partial<InsertSeedBankItem>): Promise<SeedBankItem | undefined> {
    const [updated] = await this.db.update(seedBank).set(seed as any).where(eq(seedBank.id, id)).returning();
    return updated;
  }

  async deleteSeed(id: number): Promise<void> {
    await this.db.update(seedBank).set({ isActive: false }).where(eq(seedBank.id, id));
  }

  async purchaseSeed(walletAddress: string, seedId: number): Promise<UserSeed> {
    // Increment minted count
    await this.db.update(seedBank)
      .set({ mintedCount: sql`${seedBank.mintedCount} + 1` })
      .where(eq(seedBank.id, seedId));

    // Check if user already has this seed
    const [existing] = await this.db.select().from(userSeeds)
      .where(and(
        eq(userSeeds.walletAddress, walletAddress),
        eq(userSeeds.seedId, seedId)
      ));

    if (existing) {
      const [updated] = await this.db.update(userSeeds)
        .set({ quantity: existing.quantity + 1 })
        .where(eq(userSeeds.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await this.db.insert(userSeeds)
      .values({ walletAddress, seedId, quantity: 1 })
      .returning();
    return created;
  }

  async getUserSeeds(walletAddress: string): Promise<(UserSeed & { seed: SeedBankItem })[]> {
    const results = await this.db.select()
      .from(userSeeds)
      .innerJoin(seedBank, eq(userSeeds.seedId, seedBank.id))
      .where(eq(userSeeds.walletAddress, walletAddress));
    
    return results.map(r => ({
      ...r.user_seeds,
      seed: r.seed_bank,
    }));
  }

  async getUserSeedCount(walletAddress: string, seedId: number): Promise<number> {
    const [existing] = await this.db.select().from(userSeeds)
      .where(and(
        eq(userSeeds.walletAddress, walletAddress),
        eq(userSeeds.seedId, seedId)
      ));
    return existing?.quantity || 0;
  }

  async useUserSeed(walletAddress: string, seedId: number): Promise<boolean> {
    const [existing] = await this.db.select().from(userSeeds)
      .where(and(
        eq(userSeeds.walletAddress, walletAddress),
        eq(userSeeds.seedId, seedId)
      ));

    if (!existing || existing.quantity <= 0) return false;

    if (existing.quantity === 1) {
      await this.db.delete(userSeeds).where(eq(userSeeds.id, existing.id));
    } else {
      await this.db.update(userSeeds)
        .set({ quantity: existing.quantity - 1 })
        .where(eq(userSeeds.id, existing.id));
    }
    return true;
  }
}

function formatTokenAmount(amount: string): string {
  const num = BigInt(amount);
  const decimals = BigInt(1000000);
  const whole = num / decimals;
  if (whole >= BigInt(1000000)) {
    return `${(Number(whole) / 1000000).toFixed(1)}M`;
  } else if (whole >= BigInt(1000)) {
    return `${(Number(whole) / 1000).toFixed(1)}K`;
  }
  return whole.toString();
}

export const storage = new DatabaseStorage();

// Default seed bank data - inserted on startup if the seed bank is empty
const DEFAULT_SEEDS = [
  {
    name: "OG Kush",
    description: "A legendary strain with powerful relaxation effects. Known for its distinct earthy, pine aroma with notes of lemon.",
    rarity: "rare",
    terpeneProfile: ["Myrcene", "Limonene", "Caryophyllene"],
    effects: ["Relaxation", "Euphoria", "Stress Relief"],
    flavorNotes: ["Earthy", "Pine", "Lemon"],
    thcRange: "20-26%",
    cbdRange: "0-0.3%",
    growthBonus: 15,
    budPrice: "500",
    glowColor: "#22c55e",
    totalSupply: 100,
    maxPerUser: 3,
    isActive: true,
  },
  {
    name: "Blue Dream",
    description: "A balanced hybrid offering full-body relaxation with gentle cerebral invigoration. Sweet berry aroma inherited from its Blueberry parent.",
    rarity: "uncommon",
    terpeneProfile: ["Myrcene", "Caryophyllene", "Pinene"],
    effects: ["Creative", "Uplifting", "Calm"],
    flavorNotes: ["Blueberry", "Sweet", "Vanilla"],
    thcRange: "17-24%",
    cbdRange: "0.1-0.2%",
    growthBonus: 10,
    budPrice: "300",
    glowColor: "#3b82f6",
    totalSupply: 200,
    maxPerUser: 5,
    isActive: true,
  },
  {
    name: "Sour Diesel",
    description: "A fast-acting sativa that delivers energizing, dreamy cerebral effects. Named after its pungent diesel-like aroma.",
    rarity: "uncommon",
    terpeneProfile: ["Caryophyllene", "Limonene", "Myrcene"],
    effects: ["Energizing", "Focus", "Happy"],
    flavorNotes: ["Diesel", "Citrus", "Pungent"],
    thcRange: "18-25%",
    cbdRange: "0-0.2%",
    growthBonus: 10,
    budPrice: "350",
    glowColor: "#eab308",
    totalSupply: 150,
    maxPerUser: 5,
    isActive: true,
  },
  {
    name: "Purple Haze",
    description: "A classic psychedelic strain inspired by Jimi Hendrix. Delivers a dreamy burst of euphoria with sweet, berry undertones.",
    rarity: "rare",
    terpeneProfile: ["Terpinolene", "Myrcene", "Ocimene"],
    effects: ["Euphoria", "Creative", "Energizing"],
    flavorNotes: ["Berry", "Grape", "Spicy"],
    thcRange: "17-20%",
    cbdRange: "0-0.1%",
    growthBonus: 12,
    budPrice: "450",
    glowColor: "#a855f7",
    totalSupply: 120,
    maxPerUser: 3,
    isActive: true,
  },
  {
    name: "Girl Scout Cookies",
    description: "A potent hybrid with a sweet, earthy aroma. Known for producing full-body relaxation coupled with a time-warping cerebral high.",
    rarity: "legendary",
    terpeneProfile: ["Caryophyllene", "Limonene", "Humulene"],
    effects: ["Euphoria", "Relaxation", "Happy"],
    flavorNotes: ["Sweet", "Earthy", "Mint"],
    thcRange: "25-28%",
    cbdRange: "0-0.2%",
    growthBonus: 20,
    budPrice: "1000",
    glowColor: "#f97316",
    totalSupply: 50,
    maxPerUser: 2,
    isActive: true,
  },
  {
    name: "White Widow",
    description: "A balanced hybrid first bred in the Netherlands. Famous for its white crystal resin coating and burst of euphoria and energy.",
    rarity: "common",
    terpeneProfile: ["Myrcene", "Pinene", "Caryophyllene"],
    effects: ["Relaxation", "Creative", "Social"],
    flavorNotes: ["Earthy", "Woody", "Floral"],
    thcRange: "15-20%",
    cbdRange: "0-0.2%",
    growthBonus: 5,
    budPrice: "200",
    glowColor: "#e2e8f0",
    totalSupply: null,
    maxPerUser: 10,
    isActive: true,
  },
  {
    name: "Granddaddy Purple",
    description: "A famous indica cross of Purple Urkle and Big Bud. Delivers a potent fusion of cerebral euphoria and physical relaxation.",
    rarity: "rare",
    terpeneProfile: ["Myrcene", "Pinene", "Caryophyllene"],
    effects: ["Relaxation", "Sleepy", "Pain Relief"],
    flavorNotes: ["Grape", "Berry", "Sweet"],
    thcRange: "17-24%",
    cbdRange: "0-1%",
    growthBonus: 15,
    budPrice: "500",
    glowColor: "#7c3aed",
    totalSupply: 100,
    maxPerUser: 3,
    isActive: true,
  },
  {
    name: "Jack Herer",
    description: "Named after the legendary cannabis activist, this sativa-dominant strain delivers blissful, clear-headed creativity.",
    rarity: "uncommon",
    terpeneProfile: ["Terpinolene", "Pinene", "Myrcene"],
    effects: ["Creative", "Uplifting", "Focus"],
    flavorNotes: ["Pine", "Spicy", "Woody"],
    thcRange: "18-23%",
    cbdRange: "0-0.2%",
    growthBonus: 10,
    budPrice: "350",
    glowColor: "#14b8a6",
    totalSupply: 150,
    maxPerUser: 5,
    isActive: true,
  },
  {
    name: "Alien OG",
    description: "An otherworldly mythic strain rumored to have been crossbred under moonlight. Produces transcendent euphoria with psychedelic visuals.",
    rarity: "mythic",
    terpeneProfile: ["Limonene", "Myrcene", "Linalool", "Caryophyllene"],
    effects: ["Transcendent", "Euphoria", "Psychedelic"],
    flavorNotes: ["Citrus", "Pine", "Alien Musk"],
    thcRange: "28-35%",
    cbdRange: "0.5-1%",
    growthBonus: 30,
    budPrice: "2500",
    glowColor: "#ec4899",
    totalSupply: 25,
    maxPerUser: 1,
    isActive: true,
  },
];

export async function initializeSeedBank(dbInstance?: DrizzleD1Database<any> | NodePgDatabase<any>): Promise<void> {
  try {
    const dbToUse = dbInstance || db;
    const existingSeeds = await dbToUse.select().from(seedBank).limit(1);
    if (existingSeeds.length > 0) {
      return; // Seeds already exist, skip initialization
    }

    console.log("Seed bank is empty, initializing with default seeds...");
    for (const seed of DEFAULT_SEEDS) {
      await dbToUse.insert(seedBank).values(seed as any);
    }
    console.log(`Initialized seed bank with ${DEFAULT_SEEDS.length} seeds.`);
  } catch (error) {
    console.error("Failed to initialize seed bank:", error);
  }
}
