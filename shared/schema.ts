import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").unique().notNull(),
  lastLogin: timestamp("last_login").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, lastLogin: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

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
  budBalance: number;
  terpBalance: number;
  pods: PodData[];
}
