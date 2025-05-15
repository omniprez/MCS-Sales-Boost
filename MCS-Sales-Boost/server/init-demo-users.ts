import { storage } from './storage-provider';
import { db } from './db';
import * as schema from '../shared/schema';
import { eq } from 'drizzle-orm';

// Initialize demo users
export async function initializeDemoUsers() {
  console.log('Initializing demo users...');

  try {
    // Check if we're using in-memory storage
    if (process.env.USE_IN_MEMORY_DB === 'true') {
      // Check if admin user already exists
      const adminUser = await storage.getUserByUsername('admin');
      if (!adminUser) {
        console.log('Creating admin user in memory...');
        await storage.createUser({
          username: 'admin',
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'password',
          role: 'admin'
        });
        console.log('Admin user created successfully');
      } else {
        console.log('Admin user already exists');
      }

      // Check if sales rep user exists
      const salesRepUser = await storage.getUserByUsername('salesrep');
      if (!salesRepUser) {
        console.log('Creating sales rep user in memory...');
        await storage.createUser({
          username: 'salesrep',
          name: 'Sales Rep User',
          email: 'salesrep@example.com',
          password: 'password',
          role: 'sales_rep'
        });
        console.log('Sales rep user created successfully');
      } else {
        console.log('Sales rep user already exists');
      }
    } else {
      // Using PostgreSQL
      console.log('Using PostgreSQL for user initialization');

      if (!db) {
        throw new Error('Database connection not initialized');
      }

      // Check if admin user already exists
      const adminUsers = await db.select().from(schema.users).where(eq(schema.users.username, 'admin'));
      if (adminUsers.length === 0) {
        console.log('Creating admin user in PostgreSQL...');
        await db.insert(schema.users).values({
          username: 'admin',
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'password',
          role: 'admin'
        });
        console.log('Admin user created successfully');
      } else {
        console.log('Admin user already exists');
      }

      // Check if sales rep user exists
      const salesRepUsers = await db.select().from(schema.users).where(eq(schema.users.username, 'salesrep'));
      if (salesRepUsers.length === 0) {
        console.log('Creating sales rep user in PostgreSQL...');
        await db.insert(schema.users).values({
          username: 'salesrep',
          name: 'Sales Rep User',
          email: 'salesrep@example.com',
          password: 'password',
          role: 'sales_rep'
        });
        console.log('Sales rep user created successfully');
      } else {
        console.log('Sales rep user already exists');
      }
    }

    console.log('Demo users initialization complete');
  } catch (error) {
    console.error('Error initializing demo users:', error);
  }
}
