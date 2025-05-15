import { db } from '../server/db';
import { deals } from '../shared/schema';

async function checkDeals() {
  try {
    console.log('Checking deals in database...');
    const allDeals = await db.select().from(deals);
    console.log('All deals in database:', JSON.stringify(allDeals, null, 2));
  } catch (error) {
    console.error('Error checking deals:', error);
  } finally {
    process.exit(0);
  }
}

checkDeals();
