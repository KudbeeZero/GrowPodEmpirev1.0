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
      // In a real scenario, these would come from env vars or database
      // appId: process.env.APP_ID ? parseInt(process.env.APP_ID) : undefined
    });
  });

  return httpServer;
}
