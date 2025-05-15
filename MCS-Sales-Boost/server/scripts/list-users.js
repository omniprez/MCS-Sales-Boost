// Script to list all users in the database
const { storage } = require('../storage-provider');

async function listUsers() {
  try {
    console.log('Fetching users from database...');
    const users = await storage.getUsers();
    
    console.log('\nUsers in database:');
    console.log('------------------');
    
    if (users.length === 0) {
      console.log('No users found in the database.');
    } else {
      users.forEach(user => {
        console.log(`ID: ${user.id}`);
        console.log(`Name: ${user.name}`);
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role}`);
        console.log('------------------');
      });
      
      console.log(`Total users: ${users.length}`);
    }
  } catch (error) {
    console.error('Error fetching users:', error);
  }
}

// Execute the function
listUsers();
