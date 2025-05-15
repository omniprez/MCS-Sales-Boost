import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'sales']),
  teamId: z.number().optional(),
  avatar: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export type User = z.infer<typeof userSchema>;

export const insertUserSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;

// Team schema
export const teamSchema = z.object({
  id: z.number(),
  name: z.string(),
  region: z.string(),
  type: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export type Team = z.infer<typeof teamSchema>;

export const insertTeamSchema = teamSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertTeam = z.infer<typeof insertTeamSchema>;

// Customer schema
export const customerSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  industry: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export type Customer = z.infer<typeof customerSchema>;

export const insertCustomerSchema = customerSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

// Deal schema
export const dealSchema = z.object({
  id: z.number(),
  name: z.string(),
  value: z.number(),
  category: z.string(),
  stage: z.enum(['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
  customerId: z.number(),
  userId: z.number(),
  gpPercentage: z.number().optional().nullable(),
  region: z.string().optional(),
  clientType: z.string().optional(),
  dealType: z.string().optional(),
  contractLength: z.number().optional(),
  daysInStage: z.number().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export type Deal = z.infer<typeof dealSchema>;

export const insertDealSchema = dealSchema.omit({
  id: true,
  daysInStage: true,
  createdAt: true,
  updatedAt: true
});

export type InsertDeal = z.infer<typeof insertDealSchema>;

// Target schema
export const targetSchema = z.object({
  id: z.number(),
  userId: z.number(),
  targetType: z.enum(['revenue', 'deals', 'gp']),
  targetValue: z.number(),
  currentValue: z.number().optional(),
  startDate: z.string(),
  endDate: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export type Target = z.infer<typeof targetSchema>;

export const insertTargetSchema = targetSchema.omit({
  id: true,
  currentValue: true,
  createdAt: true,
  updatedAt: true
});

export type InsertTarget = z.infer<typeof insertTargetSchema>;

// Activity schema
export const activitySchema = z.object({
  id: z.number(),
  userId: z.number(),
  dealId: z.number().optional(),
  customerId: z.number().optional(),
  type: z.string(),
  description: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export type Activity = z.infer<typeof activitySchema>;

export const insertActivitySchema = activitySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;

// Achievement schema
export const achievementSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  criteria: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export type Achievement = z.infer<typeof achievementSchema>;

// User Achievement schema
export const userAchievementSchema = z.object({
  id: z.number(),
  userId: z.number(),
  achievementId: z.number(),
  earnedAt: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export type UserAchievement = z.infer<typeof userAchievementSchema>;
