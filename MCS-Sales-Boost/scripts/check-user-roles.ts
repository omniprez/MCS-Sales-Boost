import { db } from '../server/db';
import { users } from '../shared/schema';

async function checkUserRoles() {
  try {
    if (!db) {
      throw new Error('Database connection not initialized');
    }

    console.log('Checking user roles...');
    
    const allUsers = await db.select().from(users);
    
    console.log('\nCurrent user roles:');
    allUsers.forEach(user => {
      console.log(`User: ${user.username}, Role: ${user.role}`);
    });
    
  } catch (error) {
    console.error('Error checking user roles:', error);
  } finally {
    process.exit(0);
  }
}

checkUserRoles();
