import { db } from './db';
import { eq, desc } from 'drizzle-orm';
import { Pool } from 'pg';
import * as schema from '../shared/schema';
import type { User } from '../shared/types';
import { getCurrentTime } from './utils/time-utils';

// Create a pool for direct SQL queries
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Postgres2025!@localhost:5432/salesspark'
});

// Define the interface first
export interface IStorage {
  // User operations
  getUserByUsername(username: string): Promise<User | undefined>;
  getUser(id: number): Promise<User | undefined>;
  createUser(userData: any): Promise<User>;
  updateUser(id: number, userData: any): Promise<User>;
  deleteUser(id: number): Promise<boolean>;

  // Deal operations
  getDealById(id: number): Promise<any>;
  deleteDeal(id: number): Promise<boolean>;

  // Dashboard operations
  getDashboardData(userId?: number): Promise<any>;

  // Target operations
  getTargets(userId: number): Promise<any[]>;
  getAllTargets(): Promise<any[]>;
  getTargetById(id: number): Promise<any>;
  createTarget(targetData: any): Promise<any>;
  updateTarget(id: number, targetData: any): Promise<any>;
  deleteTarget(id: number): Promise<boolean>;

  // Customer operations
  getCustomerById(id: number): Promise<any>;
  deleteCustomer(id: number): Promise<boolean>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: User[] = [];
  private deals: any[] = [];
  private customers: any[] = [];
  private targets: any[] = [];

  // User operations
  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username === username);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async createUser(userData: any): Promise<User> {
    const newUser = {
      ...userData,
      id: this.users.length + 1,
      createdAt: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: number, userData: any): Promise<User> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error(`User with ID ${id} not found`);
    }

    // Don't update the password if it's not provided
    if (!userData.password) {
      delete userData.password;
    }

    // Update the user
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...userData,
      updatedAt: new Date()
    };

    return this.users[userIndex];
  }

  async deleteUser(id: number): Promise<boolean> {
    const initialLength = this.users.length;
    this.users = this.users.filter(user => user.id !== id);
    return this.users.length < initialLength;
  }

  // Deal operations
  async getDealById(id: number): Promise<any> {
    return this.deals.find(deal => deal.id === id);
  }

  async deleteDeal(id: number): Promise<boolean> {
    const initialLength = this.deals.length;
    this.deals = this.deals.filter(deal => deal.id !== id);
    return this.deals.length < initialLength;
  }

  // Customer operations
  async getCustomerById(id: number): Promise<any> {
    return this.customers.find(customer => customer.id === id);
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const initialLength = this.customers.length;
    this.customers = this.customers.filter(customer => customer.id !== id);
    return this.customers.length < initialLength;
  }

  // Dashboard operations
  async getDashboardData(userId?: number): Promise<any> {
    return {};
  }

  // Target operations
  async getTargets(userId: number): Promise<any[]> {
    return this.targets.filter(target => target.userId === userId);
  }

  async getAllTargets(): Promise<any[]> {
    return this.targets;
  }

  async getTargetById(id: number): Promise<any> {
    return this.targets.find(target => target.id === id);
  }

  async createTarget(targetData: any): Promise<any> {
    const newTarget = {
      ...targetData,
      id: this.targets.length + 1,
      createdAt: new Date()
    };
    this.targets.push(newTarget);
    return newTarget;
  }

  async updateTarget(id: number, targetData: any): Promise<any> {
    const targetIndex = this.targets.findIndex(target => target.id === id);
    if (targetIndex === -1) {
      throw new Error(`Target with ID ${id} not found`);
    }

    this.targets[targetIndex] = {
      ...this.targets[targetIndex],
      ...targetData,
      updatedAt: new Date()
    };

    return this.targets[targetIndex];
  }

  async deleteTarget(id: number): Promise<boolean> {
    const initialLength = this.targets.length;
    this.targets = this.targets.filter(target => target.id !== id);
    return this.targets.length < initialLength;
  }


}

// PostgreSQL storage implementation
export class PgStorage implements IStorage {
  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) return undefined;
    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username));
    return users[0];
  }

  async getUser(id: number): Promise<User | undefined> {
    if (!db) return undefined;
    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id));
    return users[0];
  }

  async createUser(userData: any): Promise<User> {
    if (!db) throw new Error('Database not initialized');
    const [user] = await db.insert(schema.users).values(userData).returning();
    return user;
  }

  async updateUser(id: number, userData: any): Promise<User> {
    if (!db) throw new Error('Database not initialized');

    console.log(`Updating user ${id} with data:`, userData);

    try {
      // Don't update the password if it's not provided
      if (!userData.password) {
        delete userData.password;
      }

      // Add updated_at timestamp
      const updateData = {
        ...userData,
        updated_at: new Date()
      };

      // Update the user
      const [updatedUser] = await db.update(schema.users)
        .set(updateData)
        .where(eq(schema.users.id, id))
        .returning();

      if (!updatedUser) {
        throw new Error(`User with ID ${id} not found`);
      }

      console.log(`User ${id} updated successfully:`, updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    if (!db) throw new Error('Database not initialized');
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

  async getDashboardData(userId?: number): Promise<any> {
    return {};
  }

  async getUsersByTeam(teamId: number) {
    return await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.teamId, teamId));
  }

  async getDeals() {
    try {
      const deals = await db
        .select()
        .from(schema.deals)
        .orderBy(desc(schema.deals.created_at));

      console.log(`Storage: Found ${deals.length} deals in database`);
      if (deals.length > 0) {
        console.log('Storage: First deal:', JSON.stringify(deals[0], null, 2));
      }

      // Transform the database field names to consistent camelCase for the client
      const transformedDeals = deals.map(deal => ({
        id: deal.id,
        name: deal.name,
        value: deal.value,
        category: deal.category,
        stage: deal.stage,
        userId: deal.user_id,
        customerId: deal.customer_id,
        clientType: deal.client_type,
        dealType: deal.deal_type,
        region: deal.region,
        gpPercentage: deal.gp_percentage,
        expectedCloseDate: deal.expected_close_date,
        createdAt: deal.created_at,
        updatedAt: deal.updated_at
      }));

      console.log(`Storage: Returning ${transformedDeals.length} transformed deals`);
      return transformedDeals;
    } catch (error) {
      console.error("Error fetching deals:", error);
      return [];
    }
  }

  async getDealsByUser(userId: number) {
    try {
      const deals = await db
        .select()
        .from(schema.deals)
        .where(eq(schema.deals.user_id, userId))
        .orderBy(desc(schema.deals.createdAt));

      // Transform the database field names to consistent camelCase for the client
      return deals.map(deal => ({
        id: deal.id,
        name: deal.name,
        value: deal.value,
        category: deal.category,
        stage: deal.stage,
        userId: deal.user_id,
        customerId: deal.customer_id,
        clientType: deal.client_type,
        dealType: deal.deal_type,
        region: deal.region,
        gpPercentage: deal.gp_percentage,
        expectedCloseDate: deal.expected_close_date,
        createdAt: deal.created_at,
        updatedAt: deal.updated_at
      }));
    } catch (error) {
      console.error("Error fetching user deals:", error);
      return [];
    }
  }

  async getDealsByStage(stage: string) {
    try {
      const deals = await db
        .select()
        .from(schema.deals)
        .where(eq(schema.deals.stage, stage))
        .orderBy(desc(schema.deals.created_at));

      // Transform the database field names to consistent camelCase for the client
      return deals.map(deal => ({
        id: deal.id,
        name: deal.name,
        value: deal.value,
        category: deal.category,
        stage: deal.stage,
        userId: deal.user_id,
        customerId: deal.customer_id,
        clientType: deal.client_type,
        dealType: deal.deal_type,
        region: deal.region,
        gpPercentage: deal.gp_percentage,
        expectedCloseDate: deal.expected_close_date,
        createdAt: deal.created_at,
        updatedAt: deal.updated_at
      }));
    } catch (error) {
      console.error("Error fetching deals by stage:", error);
      return [];
    }
  }

  async getLeaderboard() {
    return await db
      .select()
      .from(schema.users)
      .orderBy(schema.users.score);
  }

  async getUserAchievements(userId: number) {
    return [];
  }

  async createDeal(dealData: any): Promise<any> {
    if (!db) throw new Error('Database not initialized');

    // Handle customer creation/lookup if customerName is provided
    let customerId = dealData.customerId;

    if (!customerId && dealData.customerName) {
      // Try to find existing customer
      const existingCustomer = await this.getCustomerByName(dealData.customerName);

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        // Create new customer
        const newCustomer = await this.createCustomer({
          name: dealData.customerName,
          type: dealData.clientType || 'unknown'
        });
        customerId = newCustomer.id;
      }
    }

    if (!customerId) {
      throw new Error('Customer ID or name is required');
    }

    // Calculate TCV if not provided - ensure all values are valid numbers
    const mrc = Math.max(0, Number(dealData.mrc) || 0);
    const nrc = Math.max(0, Number(dealData.nrc) || 0);
    const contractLength = Math.max(1, Number(dealData.contractLength) || 12);

    // Calculate TCV if not provided
    const tcv = Number(dealData.tcv) > 0
      ? Number(dealData.tcv)
      : (mrc * contractLength + nrc);

    // Ensure we have a value field (required by the database schema)
    // Use a default of 1 if all calculations result in 0 to avoid null constraint violation
    const value = Number(dealData.value) > 0
      ? Number(dealData.value)
      : (tcv > 0 ? tcv : 1);

    console.log('Creating deal with data:', {
      name: dealData.name,
      value: value,
      mrc: mrc,
      nrc: nrc,
      tcv: tcv,
      category: dealData.category,
      stage: dealData.stage,
      customerId: customerId,
      userId: dealData.userId,
      clientType: dealData.clientType || 'B2B',
      dealType: dealData.dealType || 'new',
      contractLength: contractLength
    });

    // Create a values object with all the fields
    const dealValues = {
      name: dealData.name,
      value: value,
      mrc: mrc,
      nrc: nrc,
      tcv: tcv,
      category: dealData.category,
      stage: dealData.stage,
      customer_id: customerId,
      user_id: dealData.userId,
      client_type: dealData.clientType || 'B2B',
      deal_type: dealData.dealType || 'new',
      contract_length: contractLength,
      region: dealData.region,
      gp_percentage: dealData.gpPercentage,
      expected_close_date: dealData.expectedCloseDate,
      created_at: new Date(),
      updated_at: new Date()
    };

    try {
      // Insert the deal
      const [deal] = await db.insert(schema.deals).values(dealValues).returning();
      console.log('Created deal:', deal);
      return deal;
    } catch (error: any) {
      console.error('Database error creating deal:', error);
      // Add more detailed error information
      if (error && typeof error === 'object' && 'code' in error) {
        console.error('SQL error code:', error.code);
        console.error('SQL error detail:', error.detail);
        console.error('SQL constraint:', error.constraint);
      }
      throw error;
    }
  }

  async getCustomerByName(name: string): Promise<any> {
    if (!db) return null;
    const customers = await db.select().from(schema.customers).where(eq(schema.customers.name, name)).limit(1);
    return customers.length > 0 ? customers[0] : null;
  }

  async createCustomer(customerData: any): Promise<any> {
    if (!db) throw new Error('Database not initialized');

    const [customer] = await db.insert(schema.customers).values({
      name: customerData.name,
      industry: customerData.industry || null,
      size: customerData.size || null,
      region: customerData.region || null,
      createdAt: new Date()
    }).returning();

    return customer;
  }

  async getCustomerById(id: number): Promise<any> {
    if (!db) return null;
    try {
      const customers = await db.select().from(schema.customers).where(eq(schema.customers.id, id)).limit(1);
      return customers[0];
    } catch (error) {
      console.error(`Error getting customer with ID ${id}:`, error);
      return null;
    }
  }

  async deleteCustomer(id: number): Promise<boolean> {
    if (!db) throw new Error('Database not initialized');
    try {
      console.log(`Attempting to delete customer with ID: ${id}`);

      // First, check if there are any deals associated with this customer
      const associatedDeals = await db.select().from(schema.deals).where(eq(schema.deals.customer_id, id));

      if (associatedDeals.length > 0) {
        console.log(`Found ${associatedDeals.length} deals associated with customer ${id}. Deleting them first.`);

        // Delete all associated deals
        for (const deal of associatedDeals) {
          await this.deleteDeal(deal.id);
        }
      }

      // Now delete the customer
      const result = await db.delete(schema.customers)
        .where(eq(schema.customers.id, id))
        .returning();

      console.log(`Deleted customer ${id}, result:`, result);
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting customer:', error);
      return false;
    }
  }

  async createActivity(activityData: any): Promise<any> {
    if (!db) throw new Error('Database not initialized');

    const [activity] = await db.insert(schema.activities).values({
      userId: activityData.userId,
      type: activityData.type,
      content: activityData.content,
      relatedId: activityData.relatedId,
      metadata: activityData.metadata ? JSON.stringify(activityData.metadata) : null,
      createdAt: new Date()
    }).returning();

    return activity;
  }

  async getTeams() {
    try {
      const teams = await db
        .select()
        .from(schema.teams)
        .orderBy(schema.teams.name);
      return teams;
    } catch (error) {
      console.error("Error fetching teams:", error);
      return [];
    }
  }

  async createTeam(teamData: any): Promise<any> {
    if (!db) throw new Error('Database not initialized');

    const [team] = await db.insert(schema.teams).values({
      name: teamData.name,
      region: teamData.region,
      type: teamData.type,
      createdAt: new Date()
    }).returning();

    return team;
  }

  async getUsers() {
    try {
      const users = await db
        .select()
        .from(schema.users)
        .orderBy(schema.users.name);
      return users;
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  }

  async getCustomers() {
    try {
      const customers = await db
        .select()
        .from(schema.customers)
        .orderBy(schema.customers.name);
      return customers;
    } catch (error) {
      console.error("Error fetching customers:", error);
      return [];
    }
  }

  async getDealById(id: number) {
    try {
      const deals = await db
        .select()
        .from(schema.deals)
        .where(eq(schema.deals.id, id))
        .limit(1);

      if (deals.length === 0) {
        return null;
      }

      const deal = deals[0];

      // Transform the database field names to consistent camelCase for the client
      return {
        id: deal.id,
        name: deal.name,
        value: deal.value,
        category: deal.category,
        stage: deal.stage,
        userId: deal.user_id,
        customerId: deal.customer_id,
        clientType: deal.client_type,
        dealType: deal.deal_type,
        region: deal.region,
        gpPercentage: deal.gp_percentage,
        expectedCloseDate: deal.expected_close_date,
        createdAt: deal.created_at,
        updatedAt: deal.updated_at
      };
    } catch (error) {
      console.error("Error fetching deal by ID:", error);
      return null;
    }
  }

  async deleteDeal(id: number): Promise<boolean> {
    try {
      console.log(`Attempting to delete deal with ID: ${id}`);

      // First, check if there are any related records that need to be deleted
      // For example, activities related to this deal
      try {
        if (schema.activities) {
          await db.delete(schema.activities)
            .where(eq(schema.activities.relatedId, id))
            .execute();
        }
      } catch (activityError) {
        console.error('Error deleting related activities:', activityError);
        // Continue with deal deletion even if activity deletion fails
      }

      // Now delete the deal
      const result = await db.delete(schema.deals)
        .where(eq(schema.deals.id, id))
        .returning();

      console.log(`Deleted deal ${id}, result:`, result);
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting deal:', error);
      return false;
    }
  }

  async updateDeal(id: number, updateData: any) {
    try {
      console.log(`Updating deal ${id} with data:`, updateData);
      console.log(`Deal name being updated to:`, updateData.name);

      // Check if the deal exists
      const existingDeal = await this.getDealById(id);
      if (!existingDeal) {
        throw new Error(`Deal with ID ${id} not found`);
      }

      console.log(`Existing deal:`, existingDeal);

      // Convert camelCase fields to snake_case for database
      const dbUpdateData: any = {};

      // Explicitly handle the name field
      if (updateData.name !== undefined) {
        console.log(`Setting name field to: "${updateData.name}"`);
        dbUpdateData.name = updateData.name;
      }

      if (updateData.value !== undefined) dbUpdateData.value = updateData.value;
      if (updateData.category !== undefined) dbUpdateData.category = updateData.category;
      if (updateData.stage !== undefined) dbUpdateData.stage = updateData.stage;
      if (updateData.clientType !== undefined) dbUpdateData.client_type = updateData.clientType;
      if (updateData.dealType !== undefined) dbUpdateData.deal_type = updateData.dealType;
      if (updateData.region !== undefined) dbUpdateData.region = updateData.region;
      if (updateData.gpPercentage !== undefined) dbUpdateData.gp_percentage = updateData.gpPercentage;
      if (updateData.expectedCloseDate !== undefined) dbUpdateData.expected_close_date = updateData.expectedCloseDate;
      if (updateData.contractLength !== undefined) dbUpdateData.contract_length = updateData.contractLength;

      // Always update the updated_at timestamp
      dbUpdateData.updated_at = new Date();

      // If the stage is being updated to closed_won or closed_lost, set the closed_date
      if (updateData.stage === 'closed_won' || updateData.stage === 'closed_lost') {
        dbUpdateData.closed_date = new Date();
      }

      console.log('Database update data:', dbUpdateData);

      // Log the SQL query that will be executed
      console.log('SQL update query:', `UPDATE deals SET ${Object.entries(dbUpdateData).map(([k, v]) => `${k} = '${v}'`).join(', ')} WHERE id = ${id}`);

      // Try a direct SQL query if the name field is being updated
      if (updateData.name !== undefined) {
        try {
          // Get a client from the pool
          const client = await pool.connect();
          try {
            // Execute a direct SQL query to update the name
            const result = await client.query(
              'UPDATE deals SET name = $1, updated_at = $2 WHERE id = $3 RETURNING *',
              [updateData.name, new Date(), id]
            );

            if (result.rows.length > 0) {
              console.log('Direct SQL update successful:', result.rows[0]);
              return {
                id: result.rows[0].id,
                name: result.rows[0].name,
                value: result.rows[0].value,
                category: result.rows[0].category,
                stage: result.rows[0].stage,
                userId: result.rows[0].user_id,
                customerId: result.rows[0].customer_id,
                clientType: result.rows[0].client_type,
                dealType: result.rows[0].deal_type,
                region: result.rows[0].region,
                gpPercentage: result.rows[0].gp_percentage,
                contractLength: result.rows[0].contract_length,
                expectedCloseDate: result.rows[0].expected_close_date,
                createdAt: result.rows[0].created_at,
                updatedAt: result.rows[0].updated_at
              };
            }
          } finally {
            client.release();
          }
        } catch (sqlError) {
          console.error('Direct SQL update failed:', sqlError);
        }
      }

      // If direct SQL update didn't work or wasn't attempted, use the ORM
      const [updatedDeal] = await db
        .update(schema.deals)
        .set(dbUpdateData)
        .where(eq(schema.deals.id, id))
        .returning();

      // Log the updated deal from the database
      console.log('Updated deal from database:', updatedDeal);

      console.log('Updated deal:', updatedDeal);

      // Transform the database field names to consistent camelCase for the client
      return {
        id: updatedDeal.id,
        name: updatedDeal.name,
        value: updatedDeal.value,
        category: updatedDeal.category,
        stage: updatedDeal.stage,
        userId: updatedDeal.user_id,
        customerId: updatedDeal.customer_id,
        clientType: updatedDeal.client_type,
        dealType: updatedDeal.deal_type,
        region: updatedDeal.region,
        gpPercentage: updatedDeal.gp_percentage,
        contractLength: updatedDeal.contract_length,
        expectedCloseDate: updatedDeal.expected_close_date,
        createdAt: updatedDeal.created_at,
        updatedAt: updatedDeal.updated_at
      };
    } catch (error) {
      console.error("Error updating deal:", error);
      throw error;
    }
  }

  async updateDealStage(id: number, stage: string) {
    try {
      console.log(`Updating deal ${id} stage to ${stage}`);

      // Check if the deal exists
      const existingDeal = await this.getDealById(id);
      if (!existingDeal) {
        throw new Error(`Deal with ID ${id} not found`);
      }

      // Get current time in Mauritius time zone
      const now = getCurrentTime();
      console.log(`Updating deal ${id} stage to ${stage} at Mauritius time: ${now.toISOString()}`);

      // Update the deal
      const [updatedDeal] = await db
        .update(schema.deals)
        .set({
          stage: stage,
          updated_at: now,
          // If the stage is closed_won or closed_lost, set the closed_date
          ...(stage === 'closed_won' || stage === 'closed_lost' ? { closed_date: now } : {})
        })
        .where(eq(schema.deals.id, id))
        .returning();

      // We no longer automatically create WIP items for closed_won deals
      // Instead, we'll add a button in the UI to copy deals to WIP

      console.log('Updated deal:', updatedDeal);

      // Transform the database field names to consistent camelCase for the client
      return {
        id: updatedDeal.id,
        name: updatedDeal.name,
        value: updatedDeal.value,
        category: updatedDeal.category,
        stage: updatedDeal.stage,
        userId: updatedDeal.user_id,
        customerId: updatedDeal.customer_id,
        clientType: updatedDeal.client_type,
        dealType: updatedDeal.deal_type,
        region: updatedDeal.region,
        gpPercentage: updatedDeal.gp_percentage,
        expectedCloseDate: updatedDeal.expected_close_date,
        createdAt: updatedDeal.created_at,
        updatedAt: updatedDeal.updated_at
      };
    } catch (error) {
      console.error("Error updating deal stage:", error);
      throw error;
    }
  }

  // Target methods
  async getTargets(userId: number): Promise<any[]> {
    try {
      console.log(`Fetching targets for user ${userId}`);
      const targets = await db
        .select()
        .from(schema.targets)
        .where(eq(schema.targets.userId, userId))
        .orderBy(desc(schema.targets.createdAt));

      console.log(`Found ${targets.length} targets for user ${userId}`);
      return targets;
    } catch (error) {
      console.error("Error fetching targets for user:", error);
      return [];
    }
  }

  async getAllTargets(): Promise<any[]> {
    try {
      console.log('Fetching all targets');
      const targets = await db
        .select()
        .from(schema.targets)
        .orderBy(desc(schema.targets.createdAt));

      console.log(`Found ${targets.length} targets total`);
      return targets;
    } catch (error) {
      console.error("Error fetching all targets:", error);
      return [];
    }
  }

  async getTargetById(id: number): Promise<any> {
    try {
      console.log(`Fetching target with ID ${id}`);
      const targets = await db
        .select()
        .from(schema.targets)
        .where(eq(schema.targets.id, id))
        .limit(1);

      if (targets.length === 0) {
        console.log(`Target with ID ${id} not found`);
        return null;
      }

      console.log(`Found target:`, targets[0]);
      return targets[0];
    } catch (error) {
      console.error("Error fetching target by ID:", error);
      return null;
    }
  }

  async createTarget(targetData: any): Promise<any> {
    try {
      console.log('Creating target with data:', targetData);

      // Ensure dates are properly formatted
      const data = {
        ...targetData,
        created_at: new Date()
      };

      // Insert the target
      const [target] = await db.insert(schema.targets).values(data).returning();

      console.log('Created target:', target);
      return target;
    } catch (error) {
      console.error("Error creating target:", error);
      throw error;
    }
  }

  async updateTarget(id: number, targetData: any): Promise<any> {
    try {
      console.log(`Updating target ${id} with data:`, targetData);

      // Add updated_at timestamp
      const updateData = {
        ...targetData,
        updated_at: new Date()
      };

      // Update the target
      const [updatedTarget] = await db.update(schema.targets)
        .set(updateData)
        .where(eq(schema.targets.id, id))
        .returning();

      if (!updatedTarget) {
        throw new Error(`Target with ID ${id} not found`);
      }

      console.log('Updated target:', updatedTarget);
      return updatedTarget;
    } catch (error) {
      console.error("Error updating target:", error);
      throw error;
    }
  }

  async deleteTarget(id: number): Promise<boolean> {
    try {
      console.log(`Deleting target with ID ${id}`);

      // Delete the target
      const result = await db.delete(schema.targets)
        .where(eq(schema.targets.id, id))
        .returning();

      console.log(`Delete result:`, result);
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting target:", error);
      return false;
    }
  }
}

// WIP functionality removed

// Export the classes only, not instances
// The storage-provider.ts file will create the instances
