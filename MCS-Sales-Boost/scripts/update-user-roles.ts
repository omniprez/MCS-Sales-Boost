import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function updateUserRoles() {
  try {
    console.log('Updating user roles...');
    
    // Find all users
    const allUsers = await db.select().from(users);
    
    console.log('Found', allUsers.length, 'users');
    
    // Update each user based on username
    for (const user of allUsers) {
      console.log(`Processing user: ${user.username} (${user.name}), Current role: ${user.role}`);
      
      let newRole = user.role;
      
      // Set specific roles based on username
      if (user.username.toLowerCase() === 'manish' || 
          user.username.toLowerCase() === 'admin') {
        newRole = 'admin';
      } else if (user.username.toLowerCase().includes('manager')) {
        newRole = 'manager';
      } else {
        newRole = 'sales_rep';
      }
      
      // Only update if the role is different
      if (newRole !== user.role) {
        console.log(`Updating user ${user.username} role from '${user.role}' to '${newRole}'`);
        
        const result = await db.update(users)
          .set({ role: newRole })
          .where(eq(users.id, user.id))
          .returning();
        
        console.log('Update result:', result);
      } else {
        console.log(`User ${user.username} already has the correct role: ${user.role}`);
      }
    }
    
    // Verify the updates
    const updatedUsers = await db.select().from(users);
    console.log('\nUpdated user roles:');
    updatedUsers.forEach(user => {
      console.log(`User: ${user.username}, Role: ${user.role}`);
    });
    
    console.log('\nUser role updates completed successfully');
    
  } catch (error) {
    console.error('Error updating user roles:', error);
  } finally {
    process.exit(0);
  }
}

// Run the function
updateUserRoles();
