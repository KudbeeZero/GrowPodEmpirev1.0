import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { insertSongSchema, insertAnnouncementVideoSchema, insertSeedBankSchema, insertMonitorErrorSchema, insertMonitorTransactionSchema, insertMonitorMetricSchema, insertMonitorBreadcrumbSchema, TERPENES, type TerpeneName } from "@shared/schema";

const ADMIN_WALLET = process.env.ADMIN_WALLET_ADDRESS || "";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  registerObjectStorageRoutes(app);
  
  app.post(api.users.login.path, async (req, res) => {
    try {
      const { walletAddress } = api.users.login.input.parse(req.body);
      let user = await storage.getUserByWallet(walletAddress);
      
      if (!user) {
        user = await storage.createUser({ walletAddress });
        res.status(201).json(user);
      } else {
        user = await storage.updateUserLogin(user.id);
        res.status(200).json(user);
      }
    } catch (err) {
       if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.post("/api/users/sync-balances", async (req, res) => {
    try {
      const { walletAddress, budBalance, terpBalance } = req.body;
      const user = await storage.updateUserBalances(walletAddress, budBalance, terpBalance);
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: "Failed to sync balances" });
    }
  });

  app.get(api.users.get.path, async (req, res) => {
    const user = await storage.getUserByWallet(req.params.walletAddress);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  });

  app.get(api.config.get.path, (_req, res) => {
    res.json({
      network: 'testnet',
    });
  });

  app.get("/api/leaderboard/harvests", async (_req, res) => {
    try {
      const leaderboard = await storage.getHarvestLeaderboard(20);
      res.json(leaderboard);
    } catch (err) {
      console.error("Failed to get harvest leaderboard:", err);
      res.status(500).json({ message: "Failed to get leaderboard" });
    }
  });

  app.get("/api/leaderboard/bud", async (_req, res) => {
    try {
      const leaderboard = await storage.getBudLeaderboard(20);
      res.json(leaderboard);
    } catch (err) {
      console.error("Failed to get BUD leaderboard:", err);
      res.status(500).json({ message: "Failed to get leaderboard" });
    }
  });

  app.get("/api/leaderboard/terp", async (_req, res) => {
    try {
      const leaderboard = await storage.getTerpLeaderboard(20);
      res.json(leaderboard);
    } catch (err) {
      console.error("Failed to get TERP leaderboard:", err);
      res.status(500).json({ message: "Failed to get leaderboard" });
    }
  });

  app.get("/api/stats/global", async (_req, res) => {
    try {
      const stats = await storage.getGlobalStats();
      res.json(stats);
    } catch (err) {
      console.error("Failed to get global stats:", err);
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  const recordHarvestSchema = z.object({
    walletAddress: z.string().min(58).max(58),
    budEarned: z.string().regex(/^\d+$/),
    terpEarned: z.string().regex(/^\d+$/).default("0"),
    isRareTerp: z.boolean().default(false),
  });

  app.post("/api/stats/record-harvest", async (req, res) => {
    try {
      const parsed = recordHarvestSchema.parse(req.body);
      const stats = await storage.recordHarvest(
        parsed.walletAddress, 
        parsed.budEarned, 
        parsed.terpEarned, 
        parsed.isRareTerp
      );
      res.json(stats);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Failed to record harvest:", err);
      res.status(500).json({ message: "Failed to record harvest" });
    }
  });

  // Jukebox API endpoints
  app.get("/api/jukebox/songs", async (_req, res) => {
    try {
      const songs = await storage.getAllSongs();
      res.json(songs);
    } catch (err) {
      console.error("Failed to get songs:", err);
      res.status(500).json({ message: "Failed to get songs" });
    }
  });

  app.post("/api/jukebox/songs", async (req, res) => {
    try {
      const songData = insertSongSchema.parse(req.body);
      const song = await storage.createSong(songData);
      res.status(201).json(song);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Failed to create song:", err);
      res.status(500).json({ message: "Failed to create song" });
    }
  });

  app.delete("/api/jukebox/songs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid song ID" });
      }
      await storage.deleteSong(id);
      res.status(204).send();
    } catch (err) {
      console.error("Failed to delete song:", err);
      res.status(500).json({ message: "Failed to delete song" });
    }
  });

  app.post("/api/jukebox/songs/:id/play", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid song ID" });
      }
      const song = await storage.incrementPlayCount(id);
      if (!song) {
        return res.status(404).json({ message: "Song not found" });
      }
      res.json(song);
    } catch (err) {
      console.error("Failed to update play count:", err);
      res.status(500).json({ message: "Failed to update play count" });
    }
  });

  // Announcement Video API endpoints
  app.get("/api/announcement/current", async (_req, res) => {
    try {
      const announcement = await storage.getActiveAnnouncement();
      res.json(announcement || null);
    } catch (err) {
      console.error("Failed to get announcement:", err);
      res.status(500).json({ message: "Failed to get announcement" });
    }
  });

  app.get("/api/announcement/check/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const announcement = await storage.getActiveAnnouncement();
      
      if (!announcement) {
        return res.json({ needsToWatch: false, announcement: null });
      }
      
      const hasWatched = await storage.hasUserWatchedAnnouncement(walletAddress, announcement.id);
      res.json({ 
        needsToWatch: !hasWatched, 
        announcement: hasWatched ? null : announcement 
      });
    } catch (err) {
      console.error("Failed to check announcement:", err);
      res.status(500).json({ message: "Failed to check announcement" });
    }
  });

  app.post("/api/announcement", async (req, res) => {
    try {
      const { walletAddress } = req.body;
      
      if (ADMIN_WALLET && walletAddress !== ADMIN_WALLET) {
        return res.status(403).json({ message: "Only admin can upload announcements" });
      }
      
      await storage.deactivateAllAnnouncements();
      
      const videoData = insertAnnouncementVideoSchema.parse({
        title: req.body.title,
        objectPath: req.body.objectPath,
        isActive: true,
      });
      
      const announcement = await storage.createAnnouncement(videoData);
      res.status(201).json(announcement);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Failed to create announcement:", err);
      res.status(500).json({ message: "Failed to create announcement" });
    }
  });

  app.post("/api/announcement/watched", async (req, res) => {
    try {
      const { walletAddress, announcementId } = req.body;
      
      if (!walletAddress || !announcementId) {
        return res.status(400).json({ message: "Missing walletAddress or announcementId" });
      }
      
      const user = await storage.markAnnouncementWatched(walletAddress, announcementId);
      res.json({ success: true, user });
    } catch (err) {
      console.error("Failed to mark announcement as watched:", err);
      res.status(500).json({ message: "Failed to mark as watched" });
    }
  });

  app.get("/api/announcement/admin-check/:walletAddress", async (req, res) => {
    const { walletAddress } = req.params;
    const isAdmin = ADMIN_WALLET ? walletAddress === ADMIN_WALLET : true;
    res.json({ isAdmin });
  });

  // Seed Bank API endpoints
  app.get("/api/seed-bank", async (_req, res) => {
    try {
      const seeds = await storage.getAllSeeds();
      res.json(seeds);
    } catch (err) {
      console.error("Failed to get seeds:", err);
      res.status(500).json({ message: "Failed to get seeds" });
    }
  });

  app.get("/api/seed-bank/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid seed ID" });
      }
      const seed = await storage.getSeedById(id);
      if (!seed) {
        return res.status(404).json({ message: "Seed not found" });
      }
      res.json(seed);
    } catch (err) {
      console.error("Failed to get seed:", err);
      res.status(500).json({ message: "Failed to get seed" });
    }
  });

  app.post("/api/seed-bank", async (req, res) => {
    try {
      const { walletAddress } = req.body;
      
      if (ADMIN_WALLET && walletAddress !== ADMIN_WALLET) {
        return res.status(403).json({ message: "Only admin can create seeds" });
      }
      
      const seedData = insertSeedBankSchema.parse(req.body);
      const seed = await storage.createSeed(seedData);
      res.status(201).json(seed);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Failed to create seed:", err);
      res.status(500).json({ message: "Failed to create seed" });
    }
  });

  app.delete("/api/seed-bank/:id", async (req, res) => {
    try {
      const { walletAddress } = req.body;
      
      if (ADMIN_WALLET && walletAddress !== ADMIN_WALLET) {
        return res.status(403).json({ message: "Only admin can delete seeds" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid seed ID" });
      }
      await storage.deleteSeed(id);
      res.status(204).send();
    } catch (err) {
      console.error("Failed to delete seed:", err);
      res.status(500).json({ message: "Failed to delete seed" });
    }
  });

  app.post("/api/seed-bank/:id/purchase", async (req, res) => {
    try {
      const { walletAddress } = req.body;
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address required" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid seed ID" });
      }
      
      const seed = await storage.getSeedById(id);
      if (!seed) {
        return res.status(404).json({ message: "Seed not found" });
      }
      
      // Check supply limit
      if (seed.totalSupply !== null && seed.mintedCount >= seed.totalSupply) {
        return res.status(400).json({ message: "Seed sold out" });
      }
      
      // Check per-user limit
      if (seed.maxPerUser !== null) {
        const userCurrentCount = await storage.getUserSeedCount(walletAddress, id);
        if (userCurrentCount >= seed.maxPerUser) {
          return res.status(400).json({ 
            message: `You can only own ${seed.maxPerUser} of this seed` 
          });
        }
      }
      
      const userSeed = await storage.purchaseSeed(walletAddress, id);
      res.status(201).json(userSeed);
    } catch (err) {
      console.error("Failed to purchase seed:", err);
      res.status(500).json({ message: "Failed to purchase seed" });
    }
  });

  app.get("/api/user-seeds/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const userSeeds = await storage.getUserSeeds(walletAddress);
      res.json(userSeeds);
    } catch (err) {
      console.error("Failed to get user seeds:", err);
      res.status(500).json({ message: "Failed to get user seeds" });
    }
  });

  app.post("/api/user-seeds/:seedId/use", async (req, res) => {
    try {
      const { walletAddress } = req.body;
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address required" });
      }

      const seedId = parseInt(req.params.seedId);
      if (isNaN(seedId)) {
        return res.status(400).json({ message: "Invalid seed ID" });
      }

      const success = await storage.useUserSeed(walletAddress, seedId);
      if (!success) {
        return res.status(400).json({ message: "No seeds available to use" });
      }
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to use seed:", err);
      res.status(500).json({ message: "Failed to use seed" });
    }
  });

  // ============================================================
  // Biomass NFT API Endpoints
  // ============================================================

  // Helper functions for biomass creation
  function generateTerpeneProfile(dna: string): { name: string; percentage: number }[] {
    const terpeneNames = Object.keys(TERPENES) as TerpeneName[];
    const profile: { name: string; percentage: number }[] = [];

    // Use DNA to seed randomness
    let seed = 0;
    for (let i = 0; i < dna.length; i++) {
      seed += dna.charCodeAt(i);
    }

    // Select 2-4 terpenes based on DNA
    const numTerpenes = 2 + (seed % 3);
    const selectedIndices = new Set<number>();

    for (let i = 0; i < numTerpenes; i++) {
      const index = (seed * (i + 1) * 7) % terpeneNames.length;
      selectedIndices.add(index);
    }

    let remaining = 100;
    const indices = Array.from(selectedIndices);

    indices.forEach((idx, i) => {
      const terpName = terpeneNames[idx];
      const terpData = TERPENES[terpName];
      const isLast = i === indices.length - 1;
      const percentage = isLast ? remaining : Math.floor((seed * (i + 3)) % 40) + 15;
      remaining -= percentage;

      profile.push({
        name: terpData.name,
        percentage: Math.max(percentage, 5),
      });
    });

    // Sort by percentage descending
    return profile.sort((a, b) => b.percentage - a.percentage);
  }

  function calculateQuality(careScore: number, potency: number): string {
    const total = careScore + potency;
    if (total >= 180) return "legendary";
    if (total >= 150) return "exotic";
    if (total >= 100) return "premium";
    return "standard";
  }

  function calculateRarity(terpeneProfile: { name: string; percentage: number }[], careScore: number): string {
    // Check for rare terpenes
    const rareTerpenes = terpeneProfile.filter(t => {
      const terpKey = Object.keys(TERPENES).find(k =>
        TERPENES[k as TerpeneName].name === t.name
      ) as TerpeneName | undefined;
      if (!terpKey) return false;
      const rarity = TERPENES[terpKey].rarity;
      return rarity === "epic" || rarity === "legendary";
    });

    if (rareTerpenes.length > 0 && careScore >= 80) return "legendary";
    if (rareTerpenes.length > 0 || careScore >= 90) return "epic";
    if (careScore >= 70) return "rare";
    if (careScore >= 50) return "uncommon";
    return "common";
  }

  function getDominantTerpeneColor(dominantTerpene: string): string {
    const terpKey = Object.keys(TERPENES).find(k =>
      TERPENES[k as TerpeneName].name === dominantTerpene
    ) as TerpeneName | undefined;
    return terpKey ? TERPENES[terpKey].color : "#22c55e";
  }

  // Create biomass after harvest
  const createBiomassSchema = z.object({
    walletAddress: z.string().min(58).max(58),
    podId: z.number(),
    strainDna: z.string(),
    waterCount: z.number(),
    nutrientCount: z.number(),
    budEarned: z.string(), // Raw $BUD amount with decimals
    seedId: z.number().optional(),
    plantedAt: z.string().optional(), // ISO timestamp
  });

  app.post("/api/biomass/create", async (req, res) => {
    try {
      const data = createBiomassSchema.parse(req.body);

      // Generate NFT ID
      const nftId = await storage.getNextBiomassNftId();

      // Generate terpene profile from DNA
      const terpeneProfile = generateTerpeneProfile(data.strainDna);
      const dominantTerpene = terpeneProfile[0]?.name || "Myrcene";

      // Calculate care score (max 10 waters + nutrients bonus)
      const careScore = Math.min(100, (data.waterCount * 8) + (data.nutrientCount * 4));

      // Calculate potency based on care and randomness from DNA
      const dnaSum = data.strainDna.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
      const basePotency = 40 + (dnaSum % 30);
      const potency = Math.min(100, basePotency + Math.floor(careScore * 0.3));

      // Calculate biomass in grams (base 0.25g per water, bonus for nutrients)
      const baseGrams = data.waterCount * 0.25;
      const nutrientBonus = data.nutrientCount * 0.1;
      const biomassGrams = (baseGrams + nutrientBonus).toFixed(2);

      // Determine quality and rarity
      const quality = calculateQuality(careScore, potency);
      const rarity = calculateRarity(terpeneProfile, careScore);
      const glowColor = getDominantTerpeneColor(dominantTerpene);

      const biomass = await storage.createBiomass({
        nftId,
        walletAddress: data.walletAddress,
        budValue: data.budEarned,
        biomassGrams,
        strainDna: data.strainDna,
        terpeneProfile,
        dominantTerpene,
        waterCount: data.waterCount,
        nutrientCount: data.nutrientCount,
        careScore,
        potency,
        quality,
        rarity,
        glowColor,
        seedId: data.seedId,
        podId: data.podId,
        plantedAt: data.plantedAt ? new Date(data.plantedAt) : undefined,
      });

      res.status(201).json(biomass);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Failed to create biomass:", err);
      res.status(500).json({ message: "Failed to create biomass" });
    }
  });

  // Get user's biomass collection
  app.get("/api/biomass/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const biomass = await storage.getBiomassByWallet(walletAddress);
      res.json(biomass);
    } catch (err) {
      console.error("Failed to get biomass:", err);
      res.status(500).json({ message: "Failed to get biomass" });
    }
  });

  // Get single biomass by ID
  app.get("/api/biomass/id/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid biomass ID" });
      }
      const biomass = await storage.getBiomassById(id);
      if (!biomass) {
        return res.status(404).json({ message: "Biomass not found" });
      }
      res.json(biomass);
    } catch (err) {
      console.error("Failed to get biomass:", err);
      res.status(500).json({ message: "Failed to get biomass" });
    }
  });

  // Get biomass by NFT ID
  app.get("/api/biomass/nft/:nftId", async (req, res) => {
    try {
      const { nftId } = req.params;
      const biomass = await storage.getBiomassByNftId(nftId);
      if (!biomass) {
        return res.status(404).json({ message: "Biomass not found" });
      }
      res.json(biomass);
    } catch (err) {
      console.error("Failed to get biomass:", err);
      res.status(500).json({ message: "Failed to get biomass" });
    }
  });

  // Get user's custom strains
  app.get("/api/strains/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const strains = await storage.getCustomStrainsByWallet(walletAddress);
      res.json(strains);
    } catch (err) {
      console.error("Failed to get strains:", err);
      res.status(500).json({ message: "Failed to get strains" });
    }
  });

  // ============================================================
  // GrowPod Monitor API Endpoints
  // ============================================================

  // Ingest events from client SDK (batched)
  const monitorIngestSchema = z.object({
    events: z.array(z.object({
      type: z.enum(['error', 'transaction', 'metric', 'breadcrumb']),
      // Error fields
      errorHash: z.string().optional(),
      message: z.string().optional(),
      stack: z.string().optional(),
      errorType: z.string().optional(),
      source: z.enum(['frontend', 'backend', 'blockchain']).optional(),
      // Transaction fields
      txId: z.string().optional(),
      action: z.string().optional(),
      status: z.enum(['pending', 'success', 'failed']).optional(),
      errorMessage: z.string().optional(),
      duration: z.number().optional(),
      gasUsed: z.number().optional(),
      // Metric fields
      name: z.string().optional(),
      value: z.number().optional(),
      tags: z.record(z.string()).optional(),
      // Common fields
      walletAddress: z.string().optional(),
      sessionId: z.string().optional(),
      url: z.string().optional(),
      userAgent: z.string().optional(),
      metadata: z.record(z.unknown()).optional(),
      data: z.record(z.unknown()).optional(),
      category: z.enum(['ui', 'navigation', 'blockchain', 'api', 'console']).optional(),
      timestamp: z.number(),
    })),
  });

  app.post("/api/monitor/ingest", async (req, res) => {
    try {
      const { events } = monitorIngestSchema.parse(req.body);

      for (const event of events) {
        try {
          switch (event.type) {
            case 'error':
              if (event.errorHash && event.message) {
                await storage.recordMonitorError({
                  errorHash: event.errorHash,
                  message: event.message,
                  stack: event.stack,
                  type: event.errorType || 'error',
                  source: event.source || 'frontend',
                  walletAddress: event.walletAddress,
                  url: event.url,
                  userAgent: event.userAgent,
                  metadata: event.metadata,
                  sessionId: event.sessionId,
                });
              }
              break;

            case 'transaction':
              if (event.action && event.walletAddress) {
                await storage.recordMonitorTransaction({
                  txId: event.txId,
                  walletAddress: event.walletAddress,
                  action: event.action,
                  status: event.status || 'pending',
                  errorMessage: event.errorMessage,
                  duration: event.duration,
                  gasUsed: event.gasUsed,
                  metadata: event.metadata,
                });
              }
              break;

            case 'metric':
              if (event.name && event.value !== undefined) {
                await storage.recordMonitorMetric({
                  name: event.name,
                  value: event.value,
                  tags: event.tags,
                  walletAddress: event.walletAddress,
                  sessionId: event.sessionId,
                  url: event.url,
                });
              }
              break;

            case 'breadcrumb':
              if (event.sessionId && event.action && event.category) {
                await storage.recordMonitorBreadcrumb({
                  sessionId: event.sessionId,
                  walletAddress: event.walletAddress,
                  action: event.action,
                  category: event.category,
                  data: event.data,
                });
              }
              break;
          }
        } catch (eventErr) {
          // Log but don't fail the whole batch
          console.error("Failed to process monitor event:", eventErr);
        }
      }

      res.json({ success: true, processed: events.length });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Failed to ingest monitor events:", err);
      res.status(500).json({ message: "Failed to ingest events" });
    }
  });

  // Get dashboard stats (admin only)
  app.get("/api/monitor/dashboard", async (req, res) => {
    try {
      const { walletAddress } = req.query;

      // Admin check
      if (ADMIN_WALLET && walletAddress !== ADMIN_WALLET) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const stats = await storage.getMonitorDashboardStats();
      res.json(stats);
    } catch (err) {
      console.error("Failed to get monitor dashboard:", err);
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });

  // Get errors list
  app.get("/api/monitor/errors", async (req, res) => {
    try {
      const { walletAddress, resolved, limit, offset } = req.query;

      // Admin check
      if (ADMIN_WALLET && walletAddress !== ADMIN_WALLET) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const errors = await storage.getMonitorErrors({
        resolved: resolved === 'true' ? true : resolved === 'false' ? false : undefined,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
      });

      res.json(errors);
    } catch (err) {
      console.error("Failed to get monitor errors:", err);
      res.status(500).json({ message: "Failed to get errors" });
    }
  });

  // Resolve an error
  app.post("/api/monitor/errors/:id/resolve", async (req, res) => {
    try {
      const { walletAddress } = req.body;

      // Admin check
      if (ADMIN_WALLET && walletAddress !== ADMIN_WALLET) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid error ID" });
      }

      const error = await storage.resolveMonitorError(id);
      if (!error) {
        return res.status(404).json({ message: "Error not found" });
      }

      res.json(error);
    } catch (err) {
      console.error("Failed to resolve error:", err);
      res.status(500).json({ message: "Failed to resolve error" });
    }
  });

  // Get transactions list
  app.get("/api/monitor/transactions", async (req, res) => {
    try {
      const { walletAddress: queryWallet, adminWallet, action, status, limit, offset } = req.query;

      // Admin check
      if (ADMIN_WALLET && adminWallet !== ADMIN_WALLET) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const transactions = await storage.getMonitorTransactions({
        walletAddress: queryWallet as string | undefined,
        action: action as string | undefined,
        status: status as string | undefined,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
      });

      res.json(transactions);
    } catch (err) {
      console.error("Failed to get monitor transactions:", err);
      res.status(500).json({ message: "Failed to get transactions" });
    }
  });

  // Get metrics
  app.get("/api/monitor/metrics", async (req, res) => {
    try {
      const { walletAddress, name, limit } = req.query;

      // Admin check
      if (ADMIN_WALLET && walletAddress !== ADMIN_WALLET) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const metrics = await storage.getMonitorMetrics({
        name: name as string | undefined,
        limit: limit ? parseInt(limit as string) : 100,
      });

      res.json(metrics);
    } catch (err) {
      console.error("Failed to get monitor metrics:", err);
      res.status(500).json({ message: "Failed to get metrics" });
    }
  });

  // Get breadcrumbs for a session (useful for debugging)
  app.get("/api/monitor/breadcrumbs/:sessionId", async (req, res) => {
    try {
      const { walletAddress } = req.query;

      // Admin check
      if (ADMIN_WALLET && walletAddress !== ADMIN_WALLET) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const breadcrumbs = await storage.getMonitorBreadcrumbsBySession(req.params.sessionId);
      res.json(breadcrumbs);
    } catch (err) {
      console.error("Failed to get breadcrumbs:", err);
      res.status(500).json({ message: "Failed to get breadcrumbs" });
    }
  });

  return httpServer;
}
