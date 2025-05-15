// Script to add a sample sales rep to the database
const { storage } = require('../storage-provider');
const bcrypt = require('bcrypt');

async function addSalesRep() {
  try {
    console.log('Adding a sample sales rep to the database...');
    
    // Create a sample sales rep
    const salesRep = {
      username: 'john.doe',
      password: await bcrypt.hash('password123', 10),
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'sales',
      teamId: 1
    };
    
    // Check if user already exists
    const existingUsers = await storage.getUsers();
    const existingUser = existingUsers.find(user => user.username === salesRep.username);
    
    if (existingUser) {
      console.log(`Sales rep ${salesRep.name} already exists with ID ${existingUser.id}`);
      return;
    }
    
    // Add the sales rep
    const newUser = await storage.createUser(salesRep);
    console.log(`Added sales rep: ${salesRep.name} with ID ${newUser.id}`);
    
  } catch (error) {
    console.error('Error adding sample sales rep:', error);
  }
}

// Execute the function
addSalesRep();
