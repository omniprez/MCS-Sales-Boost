import type {
  InsertUser,
  InsertTeam,
  InsertDeal,
  InsertCustomer,
  InsertProduct,
  InsertAchievement,
  InsertActivity,
  InsertTarget,
  InsertReward,
  InsertUserReward,
  InsertPointTransaction,
  InsertChallenge,
  InsertChallengeParticipant
} from './schema';

// Re-export all types from schema
export * from './schema';

// Additional interface definitions that don't conflict with schema
export interface Product {
  id: number;
  name: string;
  category: string;
  description?: string;
  createdAt?: Date;
}

export interface Reward {
  id: number;
  name: string;
  description: string;
  category: string;
  type: string;
  pointCost: number;
  isAvailable: boolean;
  image?: string;
  createdAt?: Date;
}

export interface UserReward {
  id: number;
  userId: number;
  rewardId: number;
  status: string;
  awardedAt: Date;
}

export interface PointTransaction {
  id: number;
  userId: number;
  amount: number;
  description: string;
  transactionType: string;
  referenceId?: number;
  metadata?: any;
  createdAt?: Date;
}

export interface Challenge {
  id: number;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: string;
  rewardPoints: number;
  criteria: any;
  createdAt?: Date;
}

export interface ChallengeParticipant {
  id: number;
  userId: number;
  challengeId: number;
  progress: number;
  status: string;
  joinedAt: Date;
  updatedAt?: Date;
}

// Extended type definitions for dashboard and UI
export interface DealWithRelations {
  id: number;
  title: string;
  value?: number;
  status: string;
  userId?: number;
  user?: { id: number; name: string; avatar?: string };
  customer?: { id: number; name: string };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserWithStats {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  teamId?: number;
  isChannelPartner?: boolean;
  avatar?: string;
  dealsCount?: number;
  totalRevenue?: number;
  winRate?: number;
}

export interface TargetWithProgress {
  id: number;
  userId: number;
  targetType: string;
  period: string;
  targetValue: number;
  currentValue: number;
  startDate: Date;
  endDate: Date;
  progress?: number;
  remaining?: number;
  daysLeft?: number;
}

export interface DashboardMetrics {
  revenueTotal: number;
  pipelineTotal: number;
  activeDeals: number;
  closedDeals: number;
  winRate: number;
  conversionRate: number;
}