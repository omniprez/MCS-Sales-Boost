import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  varchar,
  doublePrecision,
  boolean,
  jsonb
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(),
  teamId: integer("team_id"),
  isChannelPartner: boolean("is_channel_partner").default(false),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Team Schema
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  region: text("region"),
  type: text("type").notNull(), // internal, channel_partner
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
});

// Deal Schema
export interface NewDeal {
  title: string;
  value?: number;
  status: string;
  userId?: number;
}

export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  value: doublePrecision("value"),
  status: varchar("status").notNull(),
  user_id: integer("user_id")
    .references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const dealSchema = z.object({
  id: z.number(),
  title: z.string(),
  value: z.number().optional(),
  status: z.string(),
  userId: z.number().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

// Customer Schema
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  industry: text("industry"),
  size: text("size"), // small, medium, enterprise
  region: text("region"),
  contact: jsonb("contact"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

// Product Schema
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // wireless, fiber
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

// Achievement Schema
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  category: text("category").notNull(), // sales, team, personal
  criteria: jsonb("criteria").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

// User Achievement Schema
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  achievementId: integer("achievement_id").notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  earnedAt: true,
});

// Activity Schema
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // deal_created, deal_won, achievement_earned, etc.
  content: text("content").notNull(),
  relatedId: integer("related_id"), // Deal ID, achievement ID, etc.
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// Performance target
export const targets = pgTable("targets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  targetType: text("target_type").notNull(), // revenue, deals, gp
  period: text("period").notNull(), // monthly, quarterly, yearly
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  targetValue: doublePrecision("target_value").notNull(),
  currentValue: doublePrecision("current_value").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTargetSchema = createInsertSchema(targets).omit({
  id: true,
  createdAt: true,
});

// Rewards Schema
export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // gift_card, equipment, training, travel, etc.
  type: text("type").notNull(), // digital, physical, event, experience
  pointCost: integer("point_cost").notNull(), // Points required to redeem this reward
  isAvailable: boolean("is_available").default(true),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRewardSchema = createInsertSchema(rewards).omit({
  id: true,
  createdAt: true,
});

// User Rewards Schema
export const userRewards = pgTable("user_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  rewardId: integer("reward_id").notNull(),
  status: text("status").notNull(), // pending, redeemed, expired, canceled
  awardedAt: timestamp("awarded_at").defaultNow(),
  redeemedAt: timestamp("redeemed_at"),
  expiresAt: timestamp("expires_at"),
  metadata: jsonb("metadata"),
});

export const insertUserRewardSchema = createInsertSchema(userRewards).omit({
  id: true,
  awardedAt: true,
});

// Points Transaction Schema
export const pointTransactions = pgTable("point_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(), // Positive for earned, negative for spent
  description: text("description").notNull(),
  transactionType: text("transaction_type").notNull(), // reward, bonus, redemption
  referenceId: integer("reference_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPointTransactionSchema = createInsertSchema(pointTransactions).omit({
  id: true,
  createdAt: true,
});

// Challenges Schema (Time-bound competitive events)
export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // sales, team, etc.
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  criteria: jsonb("criteria").notNull(),
  status: text("status").notNull(), // active, completed, canceled
  rewardPoints: integer("reward_points"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChallengeSchema = createInsertSchema(challenges).omit({
  id: true,
  createdAt: true,
});

// Challenge Participants Schema
export const challengeParticipants = pgTable("challenge_participants", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull(),
  userId: integer("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
  status: text("status").notNull(), // in_progress, completed, failed
  progress: jsonb("progress"),
});

export const insertChallengeParticipantSchema = createInsertSchema(challengeParticipants).omit({
  id: true,
  joinedAt: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type Target = typeof targets.$inferSelect;
export type InsertTarget = z.infer<typeof insertTargetSchema>;

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;

export type UserReward = typeof userRewards.$inferSelect;
export type InsertUserReward = z.infer<typeof insertUserRewardSchema>;

export type PointTransaction = typeof pointTransactions.$inferSelect;
export type InsertPointTransaction = z.infer<typeof insertPointTransactionSchema>;

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;

export type ChallengeParticipant = typeof challengeParticipants.$inferSelect;
export type InsertChallengeParticipant = z.infer<typeof insertChallengeParticipantSchema>;

// WIP (Work in Progress) Schema
export const wip = pgTable("wip", {
  id: serial("id").primaryKey(),
  deal_id: integer("deal_id")
    .references(() => deals.id)
    .notNull(),
  projected_delivery_date: timestamp("projected_delivery_date"),
  actual_delivery_date: timestamp("actual_delivery_date"),
  billing_start_date: timestamp("billing_start_date"),
  status: varchar("status").notNull().default("pending"), // pending, in_progress, completed
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const wipSchema = z.object({
  id: z.number(),
  dealId: z.number(),
  projectedDeliveryDate: z.date().optional(),
  actualDeliveryDate: z.date().optional(),
  billingStartDate: z.date().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']),
  notes: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export const insertWipSchema = wipSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// WIP Update Schema (for tracking weekly updates)
export const wipUpdates = pgTable("wip_updates", {
  id: serial("id").primaryKey(),
  wip_id: integer("wip_id")
    .references(() => wip.id)
    .notNull(),
  user_id: integer("user_id")
    .references(() => users.id)
    .notNull(),
  projected_delivery_date: timestamp("projected_delivery_date"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow()
});

export const wipUpdateSchema = z.object({
  id: z.number(),
  wipId: z.number(),
  userId: z.number(),
  projectedDeliveryDate: z.date().optional(),
  notes: z.string().optional(),
  createdAt: z.date().optional()
});

export const insertWipUpdateSchema = wipUpdateSchema.omit({
  id: true,
  createdAt: true
});

// Revenue Recognition Schema
export const revenueRecognition = pgTable("revenue_recognition", {
  id: serial("id").primaryKey(),
  wip_id: integer("wip_id")
    .references(() => wip.id)
    .notNull(),
  month: varchar("month").notNull(), // Format: YYYY-MM
  amount: doublePrecision("amount").notNull(),
  recognized: boolean("recognized").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const revenueRecognitionSchema = z.object({
  id: z.number(),
  wipId: z.number(),
  month: z.string(),
  amount: z.number(),
  recognized: z.boolean().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export const insertRevenueRecognitionSchema = revenueRecognitionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type Wip = typeof wip.$inferSelect;
export type InsertWip = z.infer<typeof insertWipSchema>;

export type WipUpdate = typeof wipUpdates.$inferSelect;
export type InsertWipUpdate = z.infer<typeof insertWipUpdateSchema>;

export type RevenueRecognition = typeof revenueRecognition.$inferSelect;
export type InsertRevenueRecognition = z.infer<typeof insertRevenueRecognitionSchema>;
