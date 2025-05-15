import { db } from './db';
import { IStorage } from './storage';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import * as schema from '../shared/schema';
import { getCurrentTime } from './utils/time-utils';
import { Pool } from 'pg';
import type {
  User,
  Deal,
  NewDeal,
  Team,
  Customer,
  Product,
  Achievement,
  Activity,
  InsertActivity,
  Target,
  InsertTarget,
  Reward,
  InsertReward,
  UserReward,
  InsertUserReward,
  PointTransaction,
  InsertPointTransaction,
  Challenge,
  InsertChallenge,
  ChallengeParticipant,
  InsertChallengeParticipant,
  InsertUser,
  InsertProduct,
  InsertCustomer
} from '../shared/types';

export class PgStorage implements IStorage {
  constructor() {
    console.log('Initializing PostgreSQL storage for local database');
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return users[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    console.log(`Searching for user with username: "${username}"`);
    const users = await db.select().from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);

    if (users[0]) {
      console.log(`Found user:`, users[0]);
      return users[0];
    } else {
      console.log(`No user found with username: "${username}"`);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(schema.users).values(user).returning();
    return result[0];
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(schema.users);
  }

  async updateUser(id: number, user: Partial<User>): Promise<User | undefined> {
    const result = await db.update(schema.users)
      .set(user)
      .where(eq(schema.users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      const result = await db.delete(schema.users)
        .where(eq(schema.users.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  async getUsersByTeam(teamId: number): Promise<User[]> {
    return await db.select().from(schema.users).where(eq(schema.users.teamId, teamId));
  }

  // Deal operations

  // Team operations
  async getTeam(id: number): Promise<Team | undefined> {
    const teams = await db.select().from(schema.teams).where(eq(schema.teams.id, id)).limit(1);
    return teams[0];
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const result = await db.insert(schema.teams).values(team).returning();
    return result[0];
  }

  async getTeams(): Promise<Team[]> {
    return await db.select().from(schema.teams);
  }

  // Deal operations
  async getDeal(id: number): Promise<Deal | undefined> {
    const deals = await db.select().from(schema.deals).where(eq(schema.deals.id, id)).limit(1);
    return deals[0];
  }

  async getDealById(id: number): Promise<Deal | undefined> {
    return this.getDeal(id);
  }

  async createDeal(dealData: NewDeal): Promise<Deal> {
    try {
      // Get current time
      const now = getCurrentTime();
      console.log(`Creating deal at time: ${now.toISOString()}`);

      const insertData = {
        title: dealData.title,
        value: dealData.value || 0,
        status: dealData.status.toLowerCase(),
        user_id: dealData.userId,
        created_at: now,
        updated_at: now
      };

      const [deal] = await db.insert(schema.deals)
        .values(insertData)
        .returning();

      // Create activity for the new deal
      await this.createActivity({
        type: 'deal_created',
        userId: dealData.userId,
        content: `New deal created: ${dealData.title}`,
        relatedId: deal.id,
        metadata: {
          dealId: deal.id,
          dealTitle: dealData.title,
          value: dealData.value || 0
        }
      });

      return {
        id: deal.id,
        title: dealData.title,
        value: dealData.value || 0,
        status: dealData.status.toLowerCase(),
        userId: dealData.userId,
        createdAt: now,
        updatedAt: now
      };
    } catch (error) {
      console.error('Error in storage.createDeal:', error);
      throw error;
    }
  }

  async getDeals(): Promise<Deal[]> {
    try {
      const deals = await db.select({
        id: schema.deals.id,
        title: schema.deals.title,
        value: schema.deals.value,
        status: schema.deals.status,
        user_id: schema.deals.user_id,
        created_at: schema.deals.created_at,
        updated_at: schema.deals.updated_at
      })
      .from(schema.deals)
      .orderBy(schema.deals.created_at, 'desc');

      return deals.map(deal => ({
        id: deal.id,
        title: deal.title,
        value: deal.value || 0,
        status: deal.status,
        userId: deal.user_id || 0,
        createdAt: deal.created_at || new Date(),
        updatedAt: deal.updated_at || new Date()
      }));
    } catch (error) {
      console.error('Error fetching deals:', error);
      return [];
    }
  }

  async getDealsByUser(userId: number): Promise<Deal[]> {
    try {
      const deals = await db.select().from(schema.deals)
        .where(eq(schema.deals.user_id, userId));
      return deals.map(deal => ({
        id: deal.id,
        title: deal.title,
        value: deal.value || 0,
        status: deal.status,
        userId: deal.user_id,
        createdAt: deal.created_at,
        updatedAt: deal.updated_at
      }));
    } catch (error) {
      console.error('Error fetching deals by user:', error);
      return [];
    }
  }

  async getDealsByStage(status: string): Promise<Deal[]> {
    try {
      const deals = await db.select().from(schema.deals).where(eq(schema.deals.status, status));
      return deals.map(deal => ({
        id: deal.id,
        title: deal.title,
        value: deal.value || 0,
        status: deal.status,
        userId: deal.user_id,
        createdAt: deal.created_at,
        updatedAt: deal.updated_at
      }));
    } catch (error) {
      console.error('Error fetching deals by status:', error);
      return [];
    }
  }

  async updateDeal(id: number, deal: Partial<Deal>): Promise<Deal | undefined> {
    const now = new Date();
    // Convert camelCase to snake_case for database fields
    const dbDeal = {
      title: deal.title,
      value: deal.value,
      status: deal.status,
      user_id: deal.userId,
      updated_at: now
    };

    // Remove undefined values
    Object.keys(dbDeal).forEach(key => dbDeal[key] === undefined && delete dbDeal[key]);

    const result = await db.update(schema.deals)
      .set(dbDeal)
      .where(eq(schema.deals.id, id))
      .returning();

    if (result.length === 0) return undefined;

    return {
      id: result[0].id,
      title: result[0].title,
      value: result[0].value || 0,
      status: result[0].status,
      userId: result[0].user_id,
      createdAt: result[0].created_at,
      updatedAt: result[0].updated_at
    };
  }

  async updateDealStage(id: number, status: string): Promise<Deal | undefined> {
    const now = new Date();
    const result = await db.update(schema.deals)
      .set({
        status,
        updated_at: now
      })
      .where(eq(schema.deals.id, id))
      .returning();

    if (result.length === 0) return undefined;

    return {
      id: result[0].id,
      title: result[0].title,
      value: result[0].value || 0,
      status: result[0].status,
      userId: result[0].user_id,
      createdAt: result[0].created_at,
      updatedAt: result[0].updated_at
    };
  }

  async deleteDeal(id: number): Promise<boolean> {
    // Get a direct connection to the database for transaction support
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Postgres2025!@localhost:5432/salesspark'
    });

    const client = await pool.connect();

    try {
      console.log(`Attempting to delete deal with ID: ${id} using transaction`);

      // Start a transaction
      await client.query('BEGIN');

      try {
        // 1. First, check if the deal exists
        const dealCheck = await client.query('SELECT * FROM deals WHERE id = $1', [id]);
        if (dealCheck.rows.length === 0) {
          console.error(`Deal with ID ${id} not found`);
          await client.query('ROLLBACK');
          return false;
        }

        console.log(`Found deal: ${JSON.stringify(dealCheck.rows[0], null, 2)}`);

        // Let's check all tables that might have foreign key constraints to deals
        console.log(`Checking for all possible related records for deal ${id}`);

        // Check for installations
        try {
          const installationsCheck = await client.query('SELECT * FROM installations WHERE deal_id = $1', [id]);
          if (installationsCheck.rows.length > 0) {
            console.log(`Found ${installationsCheck.rows.length} installation records for deal ${id}`);
            console.log(`Deleting installation records for deal ${id}`);
            await client.query('DELETE FROM installations WHERE deal_id = $1', [id]);
          }
        } catch (error) {
          console.log(`No installations table or error checking installations: ${error.message}`);
        }

        // Check for WIP records
        try {
          const wipCheck = await client.query('SELECT * FROM wip WHERE deal_id = $1', [id]);
          if (wipCheck.rows.length > 0) {
            console.log(`Found ${wipCheck.rows.length} WIP records for deal ${id}`);

            // For each WIP record, check and delete related records
            for (const wipRecord of wipCheck.rows) {
              const wipId = wipRecord.id;

              // Check for revenue recognition records
              try {
                const revenueCheck = await client.query('SELECT * FROM revenue_recognition WHERE wip_id = $1', [wipId]);
                if (revenueCheck.rows.length > 0) {
                  console.log(`Found ${revenueCheck.rows.length} revenue recognition records for WIP ID ${wipId}`);
                  console.log(`Deleting revenue recognition records for WIP ID ${wipId}`);
                  await client.query('DELETE FROM revenue_recognition WHERE wip_id = $1', [wipId]);
                }
              } catch (error) {
                console.log(`No revenue_recognition table or error checking revenue recognition: ${error.message}`);
              }

              // Check for WIP update records
              try {
                const wipUpdateCheck = await client.query('SELECT * FROM wip_updates WHERE wip_id = $1', [wipId]);
                if (wipUpdateCheck.rows.length > 0) {
                  console.log(`Found ${wipUpdateCheck.rows.length} WIP update records for WIP ID ${wipId}`);
                  console.log(`Deleting WIP update records for WIP ID ${wipId}`);
                  await client.query('DELETE FROM wip_updates WHERE wip_id = $1', [wipId]);
                }
              } catch (error) {
                console.log(`No wip_updates table or error checking WIP updates: ${error.message}`);
              }
            }

            // Now delete all WIP records
            console.log(`Deleting all WIP records for deal ${id}`);
            await client.query('DELETE FROM wip WHERE deal_id = $1', [id]);
          }
        } catch (error) {
          console.log(`No wip table or error checking WIP: ${error.message}`);
        }

        // Check for activities
        try {
          const activitiesCheck = await client.query('SELECT * FROM activities WHERE related_id = $1', [id]);
          if (activitiesCheck.rows.length > 0) {
            console.log(`Found ${activitiesCheck.rows.length} activity records for deal ${id}`);
            console.log(`Deleting activity records for deal ${id}`);
            await client.query('DELETE FROM activities WHERE related_id = $1', [id]);
          }
        } catch (error) {
          console.log(`No activities table or error checking activities: ${error.message}`);
        }

        // Let's check for any other tables that might reference deals
        // Get all tables in the database
        const tablesQuery = await client.query(`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
        `);

        // For each table, check if it has a column that might reference deals
        for (const table of tablesQuery.rows) {
          const tableName = table.table_name;

          // Skip tables we've already handled
          if (['deals', 'wip', 'wip_updates', 'revenue_recognition', 'activities', 'installations'].includes(tableName)) {
            continue;
          }

          // Check if this table has a column that might reference deals
          const columnsQuery = await client.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = $1
            AND (column_name LIKE '%deal%' OR column_name LIKE '%_id')
          `, [tableName]);

          for (const column of columnsQuery.rows) {
            const columnName = column.column_name;

            // Try to find records in this table that reference the deal
            try {
              const refQuery = await client.query(`
                SELECT COUNT(*) FROM "${tableName}" WHERE "${columnName}" = $1
              `, [id]);

              const count = parseInt(refQuery.rows[0].count);
              if (count > 0) {
                console.log(`Found ${count} records in ${tableName}.${columnName} referencing deal ${id}`);
                console.log(`Deleting records from ${tableName} where ${columnName} = ${id}`);
                await client.query(`DELETE FROM "${tableName}" WHERE "${columnName}" = $1`, [id]);
              }
            } catch (error) {
              // This might fail if the column doesn't actually reference deals
              console.log(`Error checking references in ${tableName}.${columnName}: ${error.message}`);
            }
          }
        }

        // Finally, delete the deal
        console.log(`Executing final deal deletion for deal ${id}`);
        const result = await client.query('DELETE FROM deals WHERE id = $1 RETURNING *', [id]);

        // Commit the transaction
        await client.query('COMMIT');

        console.log(`Deleted deal ${id}, result:`, result.rows);
        return result.rows.length > 0;
      } catch (innerError) {
        // Rollback the transaction in case of error
        console.error('Error during transaction, rolling back:', innerError);
        await client.query('ROLLBACK');

        // Try a more direct approach if the transaction failed
        console.log('Attempting direct deletion with CASCADE option...');

        try {
          // This is a last resort - try to directly delete with CASCADE
          // First, let's check if there are any foreign key constraints
          const constraintsQuery = await client.query(`
            SELECT tc.constraint_name, tc.table_name, kcu.column_name,
                   ccu.table_name AS foreign_table_name,
                   ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND (ccu.table_name = 'deals' OR tc.table_name = 'deals');
          `);

          console.log('Foreign key constraints involving deals table:', constraintsQuery.rows);

          // Try a direct deletion with CASCADE if supported
          try {
            console.log('Attempting direct deletion with CASCADE...');
            await client.query('DELETE FROM deals WHERE id = $1 CASCADE', [id]);
            console.log(`Deal ${id} deleted with CASCADE`);
            return true;
          } catch (cascadeError) {
            console.error('CASCADE deletion failed:', cascadeError);

            // If CASCADE doesn't work, try to temporarily disable foreign key constraints
            try {
              console.log('Attempting to temporarily disable foreign key constraints...');
              await client.query('SET CONSTRAINTS ALL DEFERRED');
              await client.query('DELETE FROM deals WHERE id = $1', [id]);
              console.log(`Deal ${id} deleted with constraints deferred`);
              return true;
            } catch (deferError) {
              console.error('Deferred constraints deletion failed:', deferError);
              return false;
            }
          }
        } catch (directError) {
          console.error('Direct deletion approaches failed:', directError);
          return false;
        }
      }
    } catch (outerError) {
      console.error('Outer error in deleteDeal:', outerError);
      return false;
    } finally {
      // Release the client back to the pool
      client.release();
      await pool.end();
    }
  }

  // Customer operations
  async getCustomer(id: number): Promise<Customer | undefined> {
    const customers = await db.select().from(schema.customers).where(eq(schema.customers.id, id)).limit(1);
    return customers[0];
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const result = await db.insert(schema.customers).values(customer).returning();
    return result[0];
  }

  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(schema.customers);
  }

  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    const products = await db.select().from(schema.products).where(eq(schema.products.id, id)).limit(1);
    return products[0];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await db.insert(schema.products).values(product).returning();
    return result[0];
  }

  async getProducts(): Promise<Product[]> {
    return await db.select().from(schema.products);
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await db.select().from(schema.products).where(eq(schema.products.category, category));
  }

  // Achievement operations
  async getAchievement(id: number): Promise<Achievement | undefined> {
    const achievements = await db.select().from(schema.achievements).where(eq(schema.achievements.id, id)).limit(1);
    return achievements[0];
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const result = await db.insert(schema.achievements).values(achievement).returning();
    return result[0];
  }

  async getAchievements(): Promise<Achievement[]> {
    return await db.select().from(schema.achievements);
  }

  // User achievements
  async getUserAchievements(userId: number): Promise<{achievement: Achievement, earnedAt: Date}[]> {
    const result = await db.select({
      achievement: schema.achievements,
      userAchievement: schema.userAchievements
    })
    .from(schema.userAchievements)
    .where(eq(schema.userAchievements.userId, userId))
    .innerJoin(schema.achievements, eq(schema.userAchievements.achievementId, schema.achievements.id));

    return result.map(item => ({
      achievement: item.achievement,
      earnedAt: item.userAchievement.earnedAt
    }));
  }

  async awardAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement> {
    const result = await db.insert(schema.userAchievements).values(userAchievement).returning();
    return result[0];
  }

  // Activity operations
  async getActivities(): Promise<Activity[]> {
    return await db.select().from(schema.activities)
      .orderBy(desc(schema.activities.createdAt));
  }

  async getActivitiesByUser(userId: number): Promise<Activity[]> {
    return await db.select().from(schema.activities)
      .where(eq(schema.activities.userId, userId))
      .orderBy(desc(schema.activities.createdAt));
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const result = await db.insert(schema.activities).values(activity).returning();
    return result[0];
  }

  async getRecentActivities(limit: number): Promise<Activity[]> {
    return await db.select().from(schema.activities)
      .orderBy(desc(schema.activities.createdAt))
      .limit(limit);
  }

  // Performance targets
  async getTargets(userId: number): Promise<Target[]> {
    return await db.select().from(schema.targets).where(eq(schema.targets.userId, userId));
  }

  async createTarget(target: InsertTarget): Promise<Target> {
    const result = await db.insert(schema.targets).values(target).returning();
    return result[0];
  }

  async updateTarget(id: number, target: Partial<Target>): Promise<Target | undefined> {
    const result = await db.update(schema.targets)
      .set(target)
      .where(eq(schema.targets.id, id))
      .returning();
    return result[0];
  }

  async getAllTargets(): Promise<Target[]> {
    return await db.select().from(schema.targets);
  }

  // Dashboard data
  async getDashboardData(userId?: number): Promise<any> {
    // Implementation similar to MemStorage but with SQL queries
    let deals: any[] = [];

    if (userId) {
      deals = await db.select().from(schema.deals).where(eq(schema.deals.userId, userId));
    } else {
      deals = await db.select().from(schema.deals);
    }

    const totalValue = deals.reduce((total, deal) => total + deal.value, 0);
    const closedDeals = deals.filter(deal => deal.stage === 'closed_won');
    const closedValue = closedDeals.reduce((total, deal) => total + deal.value, 0);

    return {
      totalDeals: deals.length,
      totalValue,
      closedDeals: closedDeals.length,
      closedValue,
      pipeline: {
        prospecting: deals.filter(deal => deal.stage === 'prospecting').length,
        qualification: deals.filter(deal => deal.stage === 'qualification').length,
        proposal: deals.filter(deal => deal.stage === 'proposal').length,
        negotiation: deals.filter(deal => deal.stage === 'negotiation').length,
        closed_won: deals.filter(deal => deal.stage === 'closed_won').length,
        closed_lost: deals.filter(deal => deal.stage === 'closed_lost').length,
      },
      categories: {
        wireless: deals.filter(deal => deal.category === 'wireless').length,
        fiber: deals.filter(deal => deal.category === 'fiber').length,
      }
    };
  }

  async getLeaderboard(): Promise<any[]> {
    // Get all users with their deals
    const users = await db.select().from(schema.users);
    const userDeals = await Promise.all(users.map(async user => {
      const deals = await this.getDealsByUser(user.id);
      const closedWonDeals = deals.filter(deal => deal.stage === 'closed_won');
      const totalValue = closedWonDeals.reduce((sum, deal) => sum + deal.value, 0);

      return {
        id: user.id,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        deals: deals.length,
        closedDeals: closedWonDeals.length,
        totalValue
      };
    }));

    // Sort by total value
    return userDeals.sort((a, b) => b.totalValue - a.totalValue);
  }

  async getSalesPipelineData(): Promise<any[]> {
    const allDeals = await db.select().from(schema.deals);
    const allUsers = await db.select().from(schema.users);
    const allCustomers = await db.select().from(schema.customers);

    return allDeals.map(deal => {
      const user = allUsers.find(u => u.id === deal.userId);
      const customer = allCustomers.find(c => c.id === deal.customerId);

      return {
        id: deal.id,
        name: deal.name,
        value: deal.value,
        stage: deal.stage,
        category: deal.category,
        user: user ? {
          id: user.id,
          name: user.name,
          avatar: user.avatar
        } : undefined,
        customer: customer ? {
          id: customer.id,
          name: customer.name
        } : undefined,
        expectedCloseDate: deal.expectedCloseDate,
        createdAt: deal.createdAt
      };
    });
  }

  async getPerformanceOverview(): Promise<any> {
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const startOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const endOfLastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);

    // Get deals closed this month
    const currentMonthDeals = await db.select()
      .from(schema.deals)
      .where(
        and(
          eq(schema.deals.stage, 'closed_won'),
          gte(schema.deals.closedDate, startOfMonth)
        )
      );

    // Get deals closed last month
    const lastMonthDeals = await db.select()
      .from(schema.deals)
      .where(
        and(
          eq(schema.deals.stage, 'closed_won'),
          gte(schema.deals.closedDate, startOfLastMonth),
          lte(schema.deals.closedDate, endOfLastMonth)
        )
      );

    const currentMonthRevenue = currentMonthDeals.reduce((sum, deal) => sum + deal.value, 0);
    const lastMonthRevenue = lastMonthDeals.reduce((sum, deal) => sum + deal.value, 0);

    return {
      currentMonth: {
        revenue: currentMonthRevenue,
        deals: currentMonthDeals.length,
        average: currentMonthDeals.length > 0 ? currentMonthRevenue / currentMonthDeals.length : 0
      },
      lastMonth: {
        revenue: lastMonthRevenue,
        deals: lastMonthDeals.length,
        average: lastMonthDeals.length > 0 ? lastMonthRevenue / lastMonthDeals.length : 0
      },
      change: {
        revenue: lastMonthRevenue > 0 ? (currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100 : 100,
        deals: lastMonthDeals.length > 0 ? (currentMonthDeals.length - lastMonthDeals.length) / lastMonthDeals.length * 100 : 100
      }
    };
  }

  // Rewards operations
  async getReward(id: number): Promise<Reward | undefined> {
    const rewards = await db.select().from(schema.rewards).where(eq(schema.rewards.id, id)).limit(1);
    return rewards[0];
  }

  async createReward(reward: InsertReward): Promise<Reward> {
    const result = await db.insert(schema.rewards).values(reward).returning();
    return result[0];
  }

  async getRewards(): Promise<Reward[]> {
    return await db.select().from(schema.rewards);
  }

  async getRewardsByCategory(category: string): Promise<Reward[]> {
    return await db.select().from(schema.rewards).where(eq(schema.rewards.category, category));
  }

  async getRewardsByType(type: string): Promise<Reward[]> {
    return await db.select().from(schema.rewards).where(eq(schema.rewards.type, type));
  }

  async getAvailableRewards(): Promise<Reward[]> {
    return await db.select().from(schema.rewards).where(eq(schema.rewards.isAvailable, true));
  }

  // User rewards operations
  async getUserRewards(userId: number): Promise<UserReward[]> {
    return await db.select().from(schema.userRewards).where(eq(schema.userRewards.userId, userId));
  }

  async awardUserReward(userReward: InsertUserReward): Promise<UserReward> {
    const result = await db.insert(schema.userRewards).values(userReward).returning();
    return result[0];
  }

  async updateUserRewardStatus(id: number, status: string): Promise<UserReward | undefined> {
    const result = await db.update(schema.userRewards)
      .set({ status })
      .where(eq(schema.userRewards.id, id))
      .returning();
    return result[0];
  }

  // Points operations
  async getUserPoints(userId: number): Promise<number> {
    const transactions = await db.select().from(schema.pointTransactions)
      .where(eq(schema.pointTransactions.userId, userId));

    return transactions.reduce((total, trans) => total + trans.amount, 0);
  }

  async addPointTransaction(transaction: InsertPointTransaction): Promise<PointTransaction> {
    const result = await db.insert(schema.pointTransactions).values(transaction).returning();
    return result[0];
  }

  async getPointTransactions(userId: number): Promise<PointTransaction[]> {
    return await db.select().from(schema.pointTransactions)
      .where(eq(schema.pointTransactions.userId, userId))
      .orderBy(desc(schema.pointTransactions.createdAt));
  }

  // Challenge operations
  async getChallenge(id: number): Promise<Challenge | undefined> {
    const challenges = await db.select().from(schema.challenges).where(eq(schema.challenges.id, id)).limit(1);
    return challenges[0];
  }

  async createChallenge(challenge: InsertChallenge): Promise<Challenge> {
    const result = await db.insert(schema.challenges).values(challenge).returning();
    return result[0];
  }

  async getChallenges(active?: boolean): Promise<Challenge[]> {
    if (active !== undefined) {
      // Filter based on status field instead of isActive (which doesn't exist in schema)
      return await db.select()
        .from(schema.challenges)
        .where(eq(schema.challenges.status, active ? 'active' : 'inactive'));
    }
    return await db.select().from(schema.challenges);
  }

  async updateChallenge(id: number, challenge: Partial<Challenge>): Promise<Challenge | undefined> {
    const result = await db.update(schema.challenges)
      .set(challenge)
      .where(eq(schema.challenges.id, id))
      .returning();
    return result[0];
  }

  // Challenge participant operations
  async joinChallenge(participant: InsertChallengeParticipant): Promise<ChallengeParticipant> {
    const result = await db.insert(schema.challengeParticipants).values(participant).returning();
    return result[0];
  }

  async getParticipantsByChallenge(challengeId: number): Promise<ChallengeParticipant[]> {
    return await db.select().from(schema.challengeParticipants)
      .where(eq(schema.challengeParticipants.challengeId, challengeId));
  }

  async getUserChallenges(userId: number): Promise<{challenge: Challenge, participant: ChallengeParticipant}[]> {
    const result = await db.select({
      challenge: schema.challenges,
      participant: schema.challengeParticipants
    })
    .from(schema.challengeParticipants)
    .where(eq(schema.challengeParticipants.userId, userId))
    .innerJoin(schema.challenges, eq(schema.challengeParticipants.challengeId, schema.challenges.id));

    return result.map(item => ({
      challenge: item.challenge,
      participant: item.participant
    }));
  }

  async updateChallengeParticipant(id: number, participant: Partial<ChallengeParticipant>): Promise<ChallengeParticipant | undefined> {
    const result = await db.update(schema.challengeParticipants)
      .set(participant)
      .where(eq(schema.challengeParticipants.id, id))
      .returning();

    const updatedParticipant = result[0];

    // Check if participant has completed the challenge based on status instead of isCompleted field
    if (updatedParticipant && updatedParticipant.status === 'completed') {
      const challenge = await this.getChallenge(updatedParticipant.challengeId);

      if (challenge && challenge.rewardPoints) {
        // Award points for completing the challenge
        await this.addPointTransaction({
          userId: updatedParticipant.userId,
          amount: challenge.rewardPoints, // Safely defaulting to 0 if null
          description: `Completed challenge: ${challenge.name}`,
          transactionType: 'reward',
          referenceId: challenge.id,
          metadata: { challengeName: challenge.name }
        });
      }
    }

    return updatedParticipant;
  }

  // Gamification data methods
  async getRewardsAndIncentivesData(userId?: number): Promise<any> {
    let userPoints = 0;
    let userRecentTransactions = [];
    let userAvailableRewards = [];
    let userRewards = [];
    let userChallenges = [];

    // Get data for specific user if userId is provided
    if (userId) {
      userPoints = await this.getUserPoints(userId);
      userRecentTransactions = await this.getPointTransactions(userId);
      userRewards = await this.getUserRewards(userId);
      userChallenges = await this.getUserChallenges(userId);
    }

    // Always get available rewards
    const availableRewards = await this.getAvailableRewards();

    // Get active challenges
    const activeChallenges = await this.getChallenges(true);

    // For a specific user, filter rewards they can afford
    if (userId) {
      userAvailableRewards = availableRewards.filter(reward =>
        reward.pointCost <= userPoints
      );
    }

    const allRewards = await this.getRewards();
    const redeemedRewards = await db.select()
      .from(schema.userRewards)
      .where(eq(schema.userRewards.status, 'redeemed'));

    return {
      userPoints,
      userRecentTransactions: userRecentTransactions.slice(0, 5), // Get only 5 most recent transactions
      availableRewards,
      userAvailableRewards,
      userRewards,
      activeChallenges,
      userChallenges,

      // Overview stats (for dashboard)
      totalRewards: allRewards.length,
      totalActiveChallenges: activeChallenges.length,
      totalRedeemed: redeemedRewards.length,

      // Rewards by category
      rewardsByCategory: {
        gift_card: availableRewards.filter(r => r.category === 'gift_card').length,
        equipment: availableRewards.filter(r => r.category === 'equipment').length,
        training: availableRewards.filter(r => r.category === 'training').length,
        travel: availableRewards.filter(r => r.category === 'travel').length,
        other: availableRewards.filter(r => !['gift_card', 'equipment', 'training', 'travel'].includes(r.category)).length
      }
    };
  }

  private async getCustomerByName(name: string) {
    const customers = await db
      .select()
      .from(schema.customers)
      .where(eq(schema.customers.name, name))
      .limit(1);
    return customers[0];
  }
}
