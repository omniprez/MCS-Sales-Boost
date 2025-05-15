import { db } from '../server/db';
import * as schema from '../shared/schema';
import { hash } from 'bcrypt';

async function seed() {
  try {
    console.log('Skipping teams, users, and customers as they already exist...');

    // Sample deals
    const dealsData = [
      {
        title: 'TechCorp Network Upgrade',
        value: 150000.00,
        status: 'proposal',
        user_id: 1
      }
    ];

    console.log('Inserting deals...');
    await db.insert(schema.deals).values(dealsData);

    console.log('Seed data inserted successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    // Log more details about the error
    if (error.detail) {
      console.error('Error detail:', error.detail);
    }
    throw error;
  }
}

seed();

