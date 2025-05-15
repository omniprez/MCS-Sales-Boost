import { db } from '../server/db';
import * as schema from '../shared/schema';

async function seedUsers() {
  try {
    console.log('Starting seeding process...');

    // First, delete related records in the correct order
    console.log('Deleting existing deals...');
    await db.delete(schema.deals);
    
    console.log('Deleting existing users...');
    await db.delete(schema.users);

    console.log('Deleting existing teams...');
    await db.delete(schema.teams);

    // Insert teams first
    console.log('Creating teams...');
    await db.insert(schema.teams).values([
      {
        id: 1,
        name: 'Sales Team',
        region: 'North',
        type: 'internal'
      },
      {
        id: 2,
        name: 'Support Team',
        region: 'South',
        type: 'internal'
      }
    ]);

    console.log('Inserting demo users...');
    // Insert demo users
    await db.insert(schema.users).values([
      {
        username: 'admin',
        password: 'password',
        name: 'Admin User',
        role: 'admin',
        email: 'admin@example.com',
        teamId: 1
      },
      {
        username: 'alex.morgan',
        password: 'password',
        name: 'Alex Morgan',
        role: 'user',
        email: 'alex.morgan@example.com',
        teamId: 1
      }
    ]);

    console.log('Demo users seeded successfully');

    // Verify the data
    const teams = await db.select().from(schema.teams);
    console.log('Teams in database:', teams);

    const users = await db.select().from(schema.users);
    console.log('Users in database:', users);

  } catch (error) {
    console.error('Error seeding users:', error);
    if (error.detail) {
      console.error('Error detail:', error.detail);
    }
    throw error;
  }
}

seedUsers()
  .then(() => {
    console.log('Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });

