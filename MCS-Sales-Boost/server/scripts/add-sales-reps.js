// Script to add sample sales reps to the database
const { storage } = require('../storage-provider');
const bcrypt = require('bcrypt');

async function addSalesReps() {
  try {
    console.log('Adding sample sales reps to the database...');
    
    // Sample sales reps data
    const salesReps = [
      {
        username: 'john.doe',
        password: await bcrypt.hash('password123', 10),
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'sales',
        teamId: 1
      },
      {
        username: 'jane.smith',
        password: await bcrypt.hash('password123', 10),
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: 'sales',
        teamId: 1
      },
      {
        username: 'bob.johnson',
        password: await bcrypt.hash('password123', 10),
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        role: 'sales',
        teamId: 1
      }
    ];
    
    // Check if users already exist
    const existingUsers = await storage.getUsers();
    const existingUsernames = existingUsers.map(user => user.username);
    
    // Add each sales rep if they don't already exist
    for (const rep of salesReps) {
      if (!existingUsernames.includes(rep.username)) {
        await storage.createUser(rep);
        console.log(`Added sales rep: ${rep.name}`);
      } else {
        console.log(`Sales rep ${rep.name} already exists, skipping`);
      }
    }
    
    console.log('Sample sales reps added successfully!');
  } catch (error) {
    console.error('Error adding sample sales reps:', error);
  }
}

// Execute the function
addSalesReps();
