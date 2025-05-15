import { db } from '../server/db';
import * as schema from '../shared/schema';

async function verifyData() {
  try {
    console.log('\nVerifying Teams:');
    const teams = await db.select().from(schema.teams);
    console.log(teams);

    console.log('\nVerifying Users:');
    const users = await db.select().from(schema.users);
    console.log(users.map(u => ({
      ...u,
      password: '******' // Hide password in output
    })));

    console.log('\nVerifying Customers:');
    const customers = await db.select().from(schema.customers);
    console.log(customers);

    console.log('\nVerifying Deals:');
    const deals = await db.select().from(schema.deals);
    console.log(deals);

  } catch (error) {
    console.error('Error verifying data:', error);
  }
}

verifyData();