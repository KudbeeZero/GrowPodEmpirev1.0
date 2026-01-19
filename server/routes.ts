import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
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

  return httpServer;
}
