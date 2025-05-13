import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  elo: integer("elo").notNull().default(1000),
  rank: text("rank").notNull().default("Rookie"),
  lastLogin: timestamp("last_login").notNull().defaultNow(),
  unlockedHeroes: text("unlocked_heroes").array().notNull().default(["ironman", "captain-america", "hulk", "black-widow", "thor"]),
  experience: integer("experience").notNull().default(0),
  titles: text("titles").array().notNull().default([]),
  badges: text("badges").array().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Matches table for tracking match history
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  player1Id: integer("player1_id").notNull().references(() => users.id),
  player2Id: integer("player2_id").references(() => users.id),
  winner: integer("winner").references(() => users.id),
  matchState: jsonb("match_state").notNull(),
  duration: integer("duration").notNull(),
  isBot: boolean("is_bot").notNull().default(false),
  botDifficulty: text("bot_difficulty"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
});

// Hero stats table for tracking pick rates, win rates, etc.
export const heroStats = pgTable("hero_stats", {
  id: serial("id").primaryKey(),
  heroId: text("hero_id").notNull(),
  pickCount: integer("pick_count").notNull().default(0),
  winCount: integer("win_count").notNull().default(0),
  totalDamageDealt: integer("total_damage_dealt").notNull().default(0),
  totalHealing: integer("total_healing").notNull().default(0),
  totalMatches: integer("total_matches").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertHeroStatSchema = createInsertSchema(heroStats).omit({
  id: true,
  updatedAt: true,
});

// Web socket message schemas
export const messageSchema = z.object({
  type: z.string(),
  payload: z.any(),
});

// Game-specific schemas
export const heroSelectionSchema = z.object({
  heroId: z.string(),
});

export const skillActionSchema = z.object({
  heroId: z.string(),
  skillId: z.number(),
  targetId: z.string(),
});

export const swapPositionSchema = z.object({
  heroId: z.string(),
  position: z.enum(["front", "back"]),
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type HeroStat = typeof heroStats.$inferSelect;
export type InsertHeroStat = z.infer<typeof insertHeroStatSchema>;
export type WebSocketMessage = z.infer<typeof messageSchema>;
export type HeroSelection = z.infer<typeof heroSelectionSchema>;
export type SkillAction = z.infer<typeof skillActionSchema>;
export type SwapPosition = z.infer<typeof swapPositionSchema>;
