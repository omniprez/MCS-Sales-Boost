import type {
  User,
  Team,
  Deal,
  Customer,
  Product,
  Achievement,
  Activity,
  Target,
  Reward,
  UserReward,
  PointTransaction,
  Challenge,
  ChallengeParticipant
} from './schema';

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

export type {
  User,
  Team,
  Deal,
  Customer,
  Product,
  Achievement,
  Activity,
  Target,
  Reward,
  UserReward,
  PointTransaction,
  Challenge,
  ChallengeParticipant,
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

export interface NewDeal {
  title: string;
  value?: number;
  status: string;
  userId?: number;
}

export interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  email: string;
  role: string;
  teamId?: number;
  isChannelPartner?: boolean;
  avatar?: string;
  createdAt?: Date;
}

export interface Deal {
  id: number;
  title: string;
  value?: number;
  status: string;
  userId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Target {
  id: number;
  userId: number;
  type: string;
  value: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}