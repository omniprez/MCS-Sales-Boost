import { storage } from '../server/storage-provider';

async function addSampleDeals() {
  try {
    console.log('Starting to add sample deals...');

    // Get all users
    const users = await storage.getUsers();
    console.log(`Found ${users.length} users`);

    if (users.length === 0) {
      console.error('No users found. Please create users first.');
      return;
    }

    // Get all customers
    const customers = await storage.getCustomers();
    console.log(`Found ${customers.length} customers`);

    if (customers.length === 0) {
      console.log('No customers found. Creating sample customers...');

      // Create sample customers
      const sampleCustomers = [
        { name: 'Acme Corporation', type: 'B2B' },
        { name: 'TechSolutions Inc', type: 'B2B' },
        { name: 'Global Enterprises', type: 'B2B' },
        { name: 'Innovative Systems', type: 'B2B' },
        { name: 'Digital Networks', type: 'B2B' }
      ];

      for (const customer of sampleCustomers) {
        await storage.createCustomer(customer);
      }

      console.log('Sample customers created.');
    }

    // Get customers again (including newly created ones)
    const updatedCustomers = await storage.getCustomers();

    // Create sample deals
    const stages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    const categories = ['wireless', 'fiber', 'cloud', 'security', 'consulting'];

    // Create 20 sample deals
    for (let i = 0; i < 20; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const customer = updatedCustomers[Math.floor(Math.random() * updatedCustomers.length)];
      const stage = stages[Math.floor(Math.random() * stages.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];

      // Generate a random value between 50,000 and 500,000
      const value = Math.floor(Math.random() * 450000) + 50000;

      // Generate a random contract length between 6 and 36 months
      const contractLength = Math.floor(Math.random() * 31) + 6;

      // Create the deal
      const dealData = {
        name: `${customer.name} ${category} project`,
        value,
        category,
        stage,
        customerId: customer.id,
        userId: user.id,
        clientType: 'B2B',
        dealType: 'new',
        region: 'North',
        gpPercentage: 40,
        contractLength
      };

      await storage.createDeal(dealData);
      console.log(`Created deal: ${dealData.name}, Value: ${dealData.value}, Stage: ${dealData.stage}`);
    }

    console.log('Sample deals added successfully!');
  } catch (error) {
    console.error('Error adding sample deals:', error);
  }
}

// Run the function
addSampleDeals().then(() => {
  console.log('Script completed.');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
