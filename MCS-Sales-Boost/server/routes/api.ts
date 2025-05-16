import express from 'express';
import { storage } from '../storage-provider';
import { authenticateUser, requireAdmin, requireManagerOrAdmin, requireDealOwnershipOrAdmin } from '../middleware/auth';
import dashboardRouter from './dashboard';
import adminRouter from './admin';
import pg from 'pg';

const { Pool } = pg;
import { Request, Response } from 'express';
import { User, NewDeal } from '../../shared/schema';

const router = express.Router();

// Mount the dashboard routes
router.use('/dashboard', dashboardRouter);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Direct SQL update endpoint for deals - no authentication required for this tool
router.post('/direct-update-deal', async (req, res) => {
  try {
    const { dealId, name } = req.body;

    if (!dealId || !name) {
      return res.status(400).json({ error: 'Missing required fields: dealId and name' });
    }

    console.log(`Direct SQL update: Updating deal ${dealId} name to "${name}"`);

    // Use a direct SQL query to update the deal name
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Postgres2025!@localhost:5432/salesspark'
    });

    const client = await pool.connect();
    try {
      // First check if the deal exists
      const checkResult = await client.query('SELECT * FROM deals WHERE id = $1', [dealId]);

      if (checkResult.rows.length === 0) {
        client.release();
        pool.end();
        return res.status(404).json({ error: 'Deal not found' });
      }

      console.log(`Found deal ${dealId} in database:`, checkResult.rows[0]);
      console.log(`Current name: "${checkResult.rows[0].name}"`);

      // Execute the update
      const result = await client.query(
        'UPDATE deals SET name = $1, updated_at = $2 WHERE id = $3 RETURNING *',
        [name, new Date(), dealId]
      );

      if (result.rows.length > 0) {
        console.log('Direct SQL update successful:', result.rows[0]);
        console.log(`New name: "${result.rows[0].name}"`);

        // Return the updated deal
        res.json({
          success: true,
          message: 'Deal updated successfully via direct SQL',
          deal: {
            id: result.rows[0].id,
            name: result.rows[0].name,
            updatedAt: result.rows[0].updated_at
          },
          originalDeal: checkResult.rows[0]
        });
      } else {
        console.log('Direct SQL update failed - no rows returned');
        res.status(500).json({
          error: 'Update failed',
          message: 'No rows were updated'
        });
      }
    } finally {
      client.release();
      pool.end();
    }
  } catch (error: any) {
    console.error('Error in direct SQL update:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Unknown error'
    });
  }
});

// Admin-only direct update endpoint with no authentication
router.post('/admin/direct-update-deal', async (req, res) => {
  try {
    const { dealId, name } = req.body;

    if (!dealId || !name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'dealId and name are required'
      });
    }

    console.log(`Admin direct update: Updating deal ${dealId} name to "${name}"`);

    // Update the deal using the storage provider
    const deal = await storage.getDeal(dealId);

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    // Update the deal name
    const updatedDeal = await storage.updateDeal(dealId, { name });

    if (!updatedDeal) {
      return res.status(500).json({
        error: 'Update failed',
        message: 'Failed to update deal'
      });
    }

    // Return success
    res.json({
      success: true,
      message: "Deal updated successfully via admin direct update",
      deal: updatedDeal,
      originalDeal: deal
    });
  } catch (error: any) {
    console.error('Error in admin direct update:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Unknown error'
    });
  }
});

// Get current user
router.get('/me', authenticateUser, (req, res) => {
  // The user is already authenticated by the middleware
  res.json(req.user);
});

// Get all deals
router.get('/deals', authenticateUser, async (req, res) => {
  try {
    const { stage } = req.query;

    // If stage is provided, filter deals by stage
    if (stage) {
      console.log(`Fetching deals with stage: ${stage}`);
      const deals = await storage.getDealsByStage(stage as string);
      res.json(deals);
    } else {
      // Otherwise, get all deals
      const deals = await storage.getDeals();
      res.json(deals);
    }
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

// CSV import functionality removed

// Create new deal
router.post('/deals', authenticateUser, async (req: Request & { user?: User }, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const dealData = req.body as NewDeal;
    console.log('Creating new deal with data:', JSON.stringify(dealData, null, 2));
    console.log('User from request:', JSON.stringify(req.user, null, 2));

    // Validate required fields
    if (!dealData.mrc || !dealData.category || !dealData.stage || !dealData.customerName || !dealData.clientType) {
      return res.status(400).json({
        error: 'Missing required fields',
        requiredFields: ['mrc', 'category', 'stage', 'customerName', 'clientType'],
        receivedData: dealData
      });
    }

    // Calculate TCV if not provided
    if (!dealData.tcv) {
      dealData.tcv = dealData.mrc * (dealData.contractLength || 12) + (dealData.nrc || 0);
    }

    // Ensure value field is set (required by database)
    if (!dealData.value) {
      dealData.value = dealData.tcv || 1; // Use 1 as fallback to avoid null constraint
    }

    // Add user ID to deal data
    dealData.userId = req.user.id;

    // Create a name for the deal if not provided
    if (!dealData.name) {
      try {
        const now = new Date();
        if (!isNaN(now.getTime())) {
          dealData.name = `${dealData.category} - ${dealData.customerName} - ${now.toISOString().split('T')[0]}`;
        } else {
          // Fallback if date is invalid
          dealData.name = `${dealData.category} - ${dealData.customerName}`;
        }
      } catch (error) {
        console.error('Error creating deal name with date:', error);
        dealData.name = `${dealData.category} - ${dealData.customerName}`;
      }
    }

    // Process creation date if provided
    if (dealData.creationDate && typeof dealData.creationDate === 'string') {
      try {
        // Try to parse the date string
        const parsedDate = new Date(dealData.creationDate);
        if (!isNaN(parsedDate.getTime())) {
          dealData.creationDate = parsedDate;
        } else {
          console.warn(`Invalid creation date string: ${dealData.creationDate}, will use current time`);
          delete dealData.creationDate; // Remove invalid date, storage will use current time
        }
      } catch (error) {
        console.error('Error parsing creation date:', error);
        delete dealData.creationDate; // Remove invalid date, storage will use current time
      }
    }

    console.log('Prepared deal data for storage:', JSON.stringify(dealData, null, 2));

    try {
      // Create the deal
      const deal = await storage.createDeal(dealData);
      console.log('Deal created successfully:', JSON.stringify(deal, null, 2));
      res.json(deal);
    } catch (storageError: any) {
      console.error('Error in storage.createDeal:', storageError);

      // Check if it's a database error
      if (storageError && typeof storageError === 'object' && 'code' in storageError) {
        console.error('Database error code:', storageError.code);
        console.error('Database error detail:', storageError.detail);
      }

      res.status(500).json({
        error: 'Error creating deal in database',
        message: storageError && typeof storageError === 'object' && 'message' in storageError
          ? storageError.message
          : 'Unknown error',
        code: storageError && typeof storageError === 'object' && 'code' in storageError
          ? storageError.code
          : undefined,
        detail: storageError && typeof storageError === 'object' && 'detail' in storageError
          ? storageError.detail
          : undefined
      });
    }
  } catch (error: any) {
    console.error('Error in deal creation route:', error);
    res.status(500).json({
      error: 'Error processing deal creation request',
      message: error && typeof error === 'object' && 'message' in error
        ? error.message
        : 'Unknown error'
    });
  }
});

// Get all teams
router.get('/teams', authenticateUser, async (req, res) => {
  try {
    const teams = await storage.getTeams();
    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Create new team
router.post('/teams', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { name, region, type } = req.body;

    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({
        error: 'Missing required fields',
        requiredFields: ['name', 'type']
      });
    }

    const team = await storage.createTeam({
      name,
      region,
      type
    });

    res.status(201).json(team);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({
      error: 'Failed to create team',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all users
router.get('/users', authenticateUser, requireManagerOrAdmin, async (req, res) => {
  try {
    const users = await storage.getUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create new user
router.post('/users', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { username, password, name, email, role, teamId, isChannelPartner } = req.body;

    // Validate required fields
    if (!username || !password || !name || !email || !role) {
      return res.status(400).json({
        error: 'Missing required fields',
        requiredFields: ['username', 'password', 'name', 'email', 'role']
      });
    }

    const user = await storage.createUser({
      username,
      password,
      name,
      email,
      role,
      teamId: teamId || null,
      isChannelPartner: isChannelPartner || false
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      error: 'Failed to create user',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update user
router.patch('/users/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {

    const userId = parseInt(req.params.id);
    const updateData = req.body;

    console.log(`Updating user ${userId} with data:`, updateData);

    // Check if the user exists
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Update the user
    const updatedUser = await storage.updateUser(userId, updateData);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser;

    console.log(`User ${userId} updated successfully`);
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      error: 'Failed to update user',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete user
router.delete('/users/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {

    const userId = parseInt(req.params.id);

    // Don't allow deleting yourself
    if (userId === req.user.id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'You cannot delete your own account'
      });
    }

    // Check if the user exists
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Delete the user
    const result = await storage.deleteUser(userId);

    if (result) {
      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete user'
      });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Fix deal stages
router.post('/fix-deal-stages', authenticateUser, requireAdmin, async (req, res) => {
  try {

    console.log('Starting to fix deal stages...');

    // Get all deals
    const deals = await storage.getDeals();
    console.log(`Found ${deals.length} deals to check`);

    const validStages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    let fixedCount = 0;

    // Check each deal and fix invalid stages
    for (const deal of deals) {
      if (!validStages.includes(deal.stage)) {
        console.log(`Fixing deal ${deal.id} with invalid stage "${deal.stage}"`);

        // Update to a default stage
        await storage.updateDealStage(deal.id, 'prospecting');
        fixedCount++;
      }
    }

    console.log(`Fixed ${fixedCount} deals with invalid stages`);
    res.json({
      success: true,
      message: `Fixed ${fixedCount} deals with invalid stages`,
      fixedCount
    });

  } catch (error) {
    console.error('Error fixing deal stages:', error);
    res.status(500).json({
      error: 'Failed to fix deal stages',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Assign deals to sales reps
router.post('/assign-deals-to-reps', authenticateUser, requireAdmin, async (req, res) => {
  try {

    console.log('Starting to assign deals to sales reps...');

    // Get all sales reps
    const users = await storage.getUsers();
    const salesReps = users.filter(user => {
      const role = user.role.toLowerCase();
      return role === 'sales' || role === 'sales rep' || role === 'sales_rep';
    });

    if (salesReps.length === 0) {
      return res.status(400).json({
        error: 'No sales reps found',
        message: 'No sales representatives found in the system'
      });
    }

    console.log(`Found ${salesReps.length} sales reps`);

    // Get all deals
    const deals = await storage.getDeals();
    console.log(`Found ${deals.length} deals`);

    if (deals.length === 0) {
      return res.status(400).json({
        error: 'No deals found',
        message: 'No deals found in the system'
      });
    }

    // Assign deals to sales reps
    let assignedCount = 0;

    for (let i = 0; i < deals.length; i++) {
      const deal = deals[i];

      // Skip deals that already have a user assigned
      if (deal.userId) {
        console.log(`Deal ${deal.id} already assigned to user ${deal.userId}, skipping`);
        continue;
      }

      // Assign to a random sales rep
      const randomIndex = Math.floor(Math.random() * salesReps.length);
      const salesRep = salesReps[randomIndex];

      console.log(`Assigning deal ${deal.id} to sales rep ${salesRep.name} (${salesRep.id})`);

      // Update the deal
      await storage.updateDeal(deal.id, { userId: salesRep.id });
      assignedCount++;
    }

    console.log(`Assigned ${assignedCount} deals to ${salesReps.length} sales reps`);

    res.json({
      success: true,
      message: `Assigned ${assignedCount} deals to ${salesReps.length} sales reps`,
      assignedCount,
      repsCount: salesReps.length
    });

  } catch (error) {
    console.error('Error assigning deals to sales reps:', error);
    res.status(500).json({
      error: 'Failed to assign deals to sales reps',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add a sample sales rep
router.post('/add-sample-sales-rep', authenticateUser, async (req, res) => {
  try {
    // Check if the current user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only administrators can add sample sales reps'
      });
    }

    console.log('Adding a sample sales rep...');

    // Create a sample sales rep
    const bcrypt = require('bcrypt');
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
      return res.json({
        success: true,
        message: 'Sales rep already exists',
        name: salesRep.name,
        id: existingUser.id
      });
    }

    // Add the sales rep
    const newUser = await storage.createUser(salesRep);
    console.log(`Added sales rep: ${salesRep.name} with ID ${newUser.id}`);

    res.json({
      success: true,
      message: 'Sample sales rep added successfully',
      name: salesRep.name,
      id: newUser.id
    });

  } catch (error) {
    console.error('Error adding sample sales rep:', error);
    res.status(500).json({
      error: 'Failed to add sample sales rep',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add sample deals
router.post('/add-sample-deals', authenticateUser, async (req, res) => {
  try {
    // Check if the current user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only administrators can add sample deals'
      });
    }

    console.log('Adding sample deals...');

    // Get all users to assign deals to
    const users = await storage.getUsers();
    const salesReps = users.filter(user => user.role === 'sales' || user.role === 'sales_rep');

    if (salesReps.length === 0) {
      console.log('No sales reps found, creating a default one');

      // Create a default sales rep if none exist
      const bcrypt = require('bcrypt');
      const defaultSalesRep = {
        username: 'default.rep',
        password: await bcrypt.hash('password123', 10),
        name: 'Default Sales Rep',
        email: 'default.rep@example.com',
        role: 'sales',
        teamId: 1
      };

      const newUser = await storage.createUser(defaultSalesRep);
      salesReps.push(newUser);
    }

    // Sample company names
    const companyNames = [
      'Acme Corporation', 'Globex', 'Soylent Corp', 'Initech', 'Umbrella Corp',
      'Stark Industries', 'Wayne Enterprises', 'Cyberdyne Systems', 'Massive Dynamic',
      'Oceanic Airlines', 'Dunder Mifflin', 'Pied Piper', 'Hooli', 'Prestige Worldwide',
      'Gekko & Co', 'Weyland-Yutani', 'Tyrell Corporation', 'Oscorp', 'LexCorp',
      'Wonka Industries', 'Spacely Sprockets', 'Cogswell Cogs', 'Monsters Inc'
    ];

    // Sample deal names
    const dealPrefixes = ['New', 'Expanded', 'Upgraded', 'Enterprise', 'SMB', 'Premium', 'Basic', 'Custom'];
    const dealTypes = ['Service', 'Solution', 'Package', 'Plan', 'Subscription', 'Implementation', 'Integration'];

    // Sample stages
    const stages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won'];

    // Sample categories
    const categories = ['wireless', 'fiber'];

    // Sample client types
    const clientTypes = ['B2B', 'B2C', 'Enterprise', 'SMB'];

    // Create 20 sample deals
    const sampleDeals = [];
    const dealsCount = 20;

    for (let i = 0; i < dealsCount; i++) {
      // Randomly select values
      const companyName = companyNames[Math.floor(Math.random() * companyNames.length)];
      const dealPrefix = dealPrefixes[Math.floor(Math.random() * dealPrefixes.length)];
      const dealType = dealTypes[Math.floor(Math.random() * dealTypes.length)];
      const stage = stages[Math.floor(Math.random() * stages.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const clientType = clientTypes[Math.floor(Math.random() * clientTypes.length)];
      const salesRep = salesReps[Math.floor(Math.random() * salesReps.length)];

      // Generate random value between 10,000 and 500,000
      const value = Math.floor(Math.random() * 490000) + 10000;

      // Generate random contract length between 6 and 36 months
      const contractLength = Math.floor(Math.random() * 31) + 6;

      // Create the deal
      const dealData = {
        name: `${dealPrefix} ${category} ${dealType}`,
        value,
        category,
        stage,
        customerName: companyName,
        clientType,
        dealType: 'new',
        contractLength,
        userId: salesRep.id
      };

      try {
        const deal = await storage.createDeal(dealData);
        sampleDeals.push(deal);
        console.log(`Created sample deal: ${deal.name} (${deal.id})`);
      } catch (dealError) {
        console.error('Error creating sample deal:', dealError);
      }
    }

    console.log(`Successfully created ${sampleDeals.length} sample deals`);

    res.json({
      success: true,
      message: `Added ${sampleDeals.length} sample deals`,
      dealsCount: sampleDeals.length
    });

  } catch (error) {
    console.error('Error adding sample deals:', error);
    res.status(500).json({
      error: 'Failed to add sample deals',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Reset pipeline stages
router.post('/reset-pipeline-stages', authenticateUser, async (req, res) => {
  try {
    // Check if the current user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only administrators can reset pipeline stages'
      });
    }

    console.log('Starting to reset pipeline stages...');

    // Get all deals
    const deals = await storage.getDeals();
    console.log(`Found ${deals.length} deals to reset`);

    if (deals.length === 0) {
      return res.json({
        success: true,
        message: 'No deals found to reset',
        updatedCount: 0
      });
    }

    // Define the stages we want to distribute deals across
    const stages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

    // Count how many deals we want in each stage (roughly equal distribution)
    const dealsPerStage = Math.ceil(deals.length / stages.length);
    console.log(`Aiming for approximately ${dealsPerStage} deals per stage`);

    let updatedCount = 0;

    // Update deals to distribute them across stages
    for (let i = 0; i < deals.length; i++) {
      const deal = deals[i];
      const targetStage = stages[Math.floor(i / dealsPerStage) % stages.length];

      // Only update if the stage is different
      if (deal.stage !== targetStage) {
        console.log(`Updating deal ${deal.id} from "${deal.stage}" to "${targetStage}"`);
        await storage.updateDealStage(deal.id, targetStage);
        updatedCount++;
      }
    }

    console.log(`Reset ${updatedCount} deal stages`);
    res.json({
      success: true,
      message: `Reset ${updatedCount} deals to proper pipeline stages`,
      updatedCount
    });

  } catch (error) {
    console.error('Error resetting pipeline stages:', error);
    res.status(500).json({
      error: 'Failed to reset pipeline stages',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add a sample sales rep
router.post('/add-sample-sales-rep', authenticateUser, async (req, res) => {
  try {
    // Check if the current user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only administrators can add sample sales reps'
      });
    }

    console.log('Adding a sample sales rep...');

    // Create a sample sales rep
    const bcrypt = require('bcrypt');
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
      return res.json({
        success: true,
        message: 'Sales rep already exists',
        name: salesRep.name,
        id: existingUser.id
      });
    }

    // Add the sales rep
    const newUser = await storage.createUser(salesRep);
    console.log(`Added sales rep: ${salesRep.name} with ID ${newUser.id}`);

    res.json({
      success: true,
      message: 'Sample sales rep added successfully',
      name: salesRep.name,
      id: newUser.id
    });

  } catch (error) {
    console.error('Error adding sample sales rep:', error);
    res.status(500).json({
      error: 'Failed to add sample sales rep',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add a sample sales rep
router.post('/add-sample-sales-rep', authenticateUser, async (req, res) => {
  try {
    // Check if the current user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only administrators can add sample sales reps'
      });
    }

    console.log('Adding a sample sales rep...');

    // Create a sample sales rep
    const bcrypt = require('bcrypt');
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
      return res.json({
        success: true,
        message: 'Sales rep already exists',
        name: salesRep.name,
        id: existingUser.id
      });
    }

    // Add the sales rep
    const newUser = await storage.createUser(salesRep);
    console.log(`Added sales rep: ${salesRep.name} with ID ${newUser.id}`);

    res.json({
      success: true,
      message: 'Sample sales rep added successfully',
      name: salesRep.name,
      id: newUser.id
    });

  } catch (error) {
    console.error('Error adding sample sales rep:', error);
    res.status(500).json({
      error: 'Failed to add sample sales rep',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add sample deals
router.post('/add-sample-deals', authenticateUser, requireAdmin, async (req, res) => {
  try {

    console.log('Starting to add sample deals...');

    // Get all users
    const users = await storage.getUsers();
    console.log(`Found ${users.length} users`);

    if (users.length === 0) {
      return res.status(400).json({
        error: 'No users found',
        message: 'Please create users first'
      });
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
    const createdDeals = [];
    for (let i = 0; i < 20; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const customer = updatedCustomers[Math.floor(Math.random() * updatedCustomers.length)];
      const stage = stages[Math.floor(Math.random() * stages.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];

      // Generate a random value between 50,000 and 500,000
      const value = Math.floor(Math.random() * 450000) + 50000;

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
        gpPercentage: 40
      };

      const deal = await storage.createDeal(dealData);
      createdDeals.push(deal);
      console.log(`Created deal: ${dealData.name}, Value: ${dealData.value}, Stage: ${dealData.stage}`);
    }

    console.log(`Added ${createdDeals.length} sample deals successfully!`);
    res.json({
      success: true,
      message: `Added ${createdDeals.length} sample deals to the database`,
      dealsCount: createdDeals.length
    });
  } catch (error) {
    console.error('Error adding sample deals:', error);
    res.status(500).json({
      error: 'Failed to add sample deals',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cleanup test data endpoint
router.delete('/cleanup-test-data', authenticateUser, requireAdmin, async (req, res) => {
  try {

    console.log('Starting cleanup of test data...');

    // 1. Delete test deals
    console.log('Deleting test deals...');
    const deals = await storage.getDeals();
    let deletedDealsCount = 0;

    for (const deal of deals) {
      // Check if this is a test deal (name contains "Test")
      if (deal.name && (
          deal.name.includes('Test') ||
          deal.name.includes('test') ||
          (deal.customerId && await isTestCustomer(deal.customerId))
        )) {
        console.log(`Deleting test deal: ${deal.name} (ID: ${deal.id})`);
        await storage.deleteDeal(deal.id);
        deletedDealsCount++;
      }
    }

    // 2. Delete test customers
    console.log('Deleting test customers...');
    const customers = await storage.getCustomers();
    let deletedCustomersCount = 0;

    for (const customer of customers) {
      // Check if this is a test customer
      if (customer.name && (
          customer.name.includes('Test') ||
          customer.name.includes('test')
        )) {
        console.log(`Deleting test customer: ${customer.name} (ID: ${customer.id})`);
        try {
          await storage.deleteCustomer(customer.id);
          deletedCustomersCount++;
        } catch (error) {
          console.error(`Failed to delete customer ${customer.id}: ${error.message}`);
        }
      }
    }

    // 3. Delete test users (except admin)
    console.log('Deleting test users...');
    const users = await storage.getUsers();
    let deletedUsersCount = 0;

    for (const user of users) {
      // Check if this is a test user but not the admin
      if (user.username !== 'admin' && (
          user.name.includes('Test') ||
          user.name.includes('test') ||
          user.username === 'alex.morgan'
        )) {
        console.log(`Deleting test user: ${user.name} (ID: ${user.id})`);
        await storage.deleteUser(user.id);
        deletedUsersCount++;
      }
    }

    console.log('Test data cleanup complete');
    res.json({
      success: true,
      message: 'Test data cleanup complete',
      stats: {
        deletedDeals: deletedDealsCount,
        deletedCustomers: deletedCustomersCount,
        deletedUsers: deletedUsersCount
      }
    });

  } catch (error) {
    console.error('Error cleaning up test data:', error);
    res.status(500).json({
      error: 'Failed to clean up test data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function to check if a customer is a test customer
async function isTestCustomer(customerId) {
  try {
    const customer = await storage.getCustomerById(customerId);
    return customer && (
      customer.name.includes('Test') ||
      customer.name.includes('test')
    );
  } catch (error) {
    console.error(`Error checking if customer ${customerId} is a test customer:`, error);
    return false;
  }
}

// Get dashboard data
router.get('/dashboard', authenticateUser, async (req, res) => {
  try {
    // Get the user ID from the authenticated session
    const userId = req.user.id;

    // Get all deals to calculate dashboard metrics
    const deals = await storage.getDeals();
    console.log(`Dashboard: Found ${deals.length} deals in total`);

    // Calculate metrics based on deals
    const totalSales = deals
      .filter(deal => deal.stage === 'closed_won')
      .reduce((sum, deal) => sum + deal.value, 0);

    const activeDeals = deals
      .filter(deal => !['closed_won', 'closed_lost'].includes(deal.stage))
      .length;

    console.log(`Dashboard: Active deals: ${activeDeals}, Total sales: ${totalSales}`);
    console.log(`Dashboard: Recent deals: ${JSON.stringify(deals.slice(0, 2))}`);

    // Return real data from the database
    res.json({
      totalSales,
      activeDeals,
      conversionRate: activeDeals > 0 ? Math.round((deals.filter(deal => deal.stage === 'closed_won').length / activeDeals) * 100) : 0,
      teamRank: 2,
      recentDeals: deals.slice(0, 5),
      performanceMetrics: {
        quotaCompletion: 75,
        winRate: 62
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get pipeline data
router.get('/pipeline', authenticateUser, async (req, res) => {
  try {
    console.log('Pipeline: Fetching all deals from storage');
    // Get all deals
    const deals = await storage.getDeals();
    console.log(`Pipeline: Found ${deals.length} deals in total`);

    if (deals.length === 0) {
      console.log('Pipeline: No deals found in storage!');
    } else {
      console.log('Pipeline: First 2 deals:', JSON.stringify(deals.slice(0, 2), null, 2));
      console.log('Pipeline: Deal stages:', deals.map(d => d.stage).join(', '));
    }

    // Get all users for user information
    const users = await storage.getUsers();
    console.log(`Pipeline: Found ${users.length} users`);
    if (users.length > 0) {
      console.log('Pipeline: User sample:', JSON.stringify(users[0], null, 2));
    }

    // Get all customers for customer information
    const customers = await storage.getCustomers();
    console.log(`Pipeline: Found ${customers.length} customers`);
    if (customers.length > 0) {
      console.log('Pipeline: Customer sample:', JSON.stringify(customers[0], null, 2));
    }

    // Format deals for pipeline view
    const pipelineDeals = deals.map(deal => {
      console.log('Processing deal for pipeline:', deal);

      // Find the user who created the deal
      const user = users.find(u => u.id === deal.userId);
      if (!user) {
        console.log(`Warning: No user found for deal ${deal.id} with userId ${deal.userId}`);
      }
      const userInfo = user || { name: 'Unknown User', id: 0 };

      // Find the customer for this deal
      // If customerId is missing, use customerName as the customer name
      let customerInfo;
      if (deal.customerId) {
        const customer = customers.find(c => c.id === deal.customerId);
        if (!customer) {
          console.log(`Warning: No customer found for deal ${deal.id} with customerId ${deal.customerId}`);
        }
        customerInfo = customer || { name: 'Unknown Customer', id: 0 };
      } else {
        console.log(`Using customerName for deal ${deal.id}: ${deal.customerName}`);
        customerInfo = { name: deal.customerName || 'Unknown Customer', id: 0 };
      }

      // Calculate days in stage (mock data for now)
      const daysInStage = Math.floor(Math.random() * 30) + 1;

      // Get the deal's stage, ensuring it's valid
      let stage = deal.stage;
      const validStages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

      // Only log a warning if the stage is invalid, but don't change it
      // This preserves the stage value from the database
      if (!validStages.includes(stage)) {
        console.log(`Warning: Deal ${deal.id} has invalid stage "${stage}"`);
      }

      // Calculate the deal value based on MRC, contract length, and NRC
      const dealValue = deal.value || (deal.mrc * (deal.contractLength || 12) + (deal.nrc || 0));

      const formattedDeal = {
        id: deal.id,
        name: deal.name,
        mrc: deal.mrc || 0,
        nrc: deal.nrc || 0,
        tcv: deal.tcv || 0,
        value: dealValue, // Add the value field
        contractLength: deal.contractLength || deal.contract_length || 0,
        category: deal.category,
        stage: stage,
        clientType: deal.clientType || 'B2B',
        dealType: deal.dealType || 'new',
        daysInStage,
        user: {
          id: userInfo.id,
          name: userInfo.name,
          avatar: userInfo.avatar || null,
          isChannelPartner: userInfo.is_channel_partner || false
        },
        customer: {
          id: customerInfo.id,
          name: customerInfo.name
        },
        createdAt: deal.createdAt,
        updatedAt: deal.updatedAt
      };

      return formattedDeal;
    });

    console.log(`Pipeline: Returning ${pipelineDeals.length} formatted deals`);
    if (pipelineDeals.length > 0) {
      console.log('Pipeline: First formatted deal:', JSON.stringify(pipelineDeals[0], null, 2));
    }

    res.json(pipelineDeals);
  } catch (error) {
    console.error('Error fetching pipeline data:', error);
    res.status(500).json({ error: 'Failed to fetch pipeline data' });
  }
});

// Get leaderboard data
router.get('/leaderboard', authenticateUser, async (req, res) => {
  try {
    // Get all users
    const users = await storage.getUsers();

    // Get all deals
    const deals = await storage.getDeals();

    // Calculate performance metrics for each user
    const leaderboard = users.map(user => {
      // Get deals for this user
      const userDeals = deals.filter(deal => deal.userId === user.id);

      console.log(`Found ${userDeals.length} deals for user ${user.name} (ID: ${user.id})`);

      // Calculate total revenue from closed deals
      const revenue = userDeals
        .filter(deal => deal.stage === 'closed_won')
        .reduce((sum, deal) => sum + deal.value, 0);

      // Count total deals
      const totalDeals = userDeals.length;

      return {
        id: user.id,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        revenue,
        deals: totalDeals
      };
    });

    // Sort by revenue (highest first)
    leaderboard.sort((a, b) => b.revenue - a.revenue);

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard data' });
  }
});

// Get performance data
router.get('/performance', authenticateUser, async (req, res) => {
  try {
    // Get the user ID from the authenticated session
    const userId = req.user.id;

    // Get all deals
    const deals = await storage.getDeals();

    // Filter deals for the current user
    const userDeals = deals.filter(deal => deal.userId === userId);

    console.log(`Found ${userDeals.length} deals for current user (ID: ${userId})`);

    // Calculate monthly performance data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();

    // Generate last 6 months of data
    const performanceData = [];
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12; // Handle wrapping around to previous year
      const month = months[monthIndex];

      // For demo purposes, generate some random data
      // In a real app, you would filter deals by month and calculate actual values
      performanceData.push({
        name: month,
        wireless: Math.floor(Math.random() * 60) + 20,
        fiber: Math.floor(Math.random() * 50) + 10
      });
    }

    // Calculate overall performance metrics
    const closedDeals = userDeals.filter(deal => deal.stage === 'closed_won').length;
    const totalDeals = userDeals.length;
    const winRate = totalDeals > 0 ? Math.round((closedDeals / totalDeals) * 100) : 0;

    // Calculate quota completion (mock data for demo)
    const quotaCompletion = Math.min(Math.round(Math.random() * 100) + 30, 100);

    res.json({
      chartData: performanceData,
      metrics: {
        quotaCompletion,
        winRate,
        totalDeals,
        closedDeals
      }
    });
  } catch (error) {
    console.error('Error fetching performance data:', error);
    res.status(500).json({ error: 'Failed to fetch performance data' });
  }
});

// Get recent activities
router.get('/activities', authenticateUser, async (req, res) => {
  try {
    // Get the user ID from the authenticated session
    const userId = req.user.id;

    // Get all deals to generate activities
    const deals = await storage.getDeals();

    // Get all users for user information
    const users = await storage.getUsers();

    // Generate mock activities based on deals
    // In a real app, you would fetch this from an activities table
    const activities = deals.slice(0, 10).map((deal, index) => {
      // Find the user who created the deal
      const user = users.find(u => u.id === deal.userId) || { name: 'Unknown User' };

      console.log(`Creating activity for deal ${deal.id} by user ${user.name}`);
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 7)); // Random date within last week

      // Generate different activity types
      const activityTypes = [
        { type: 'deal_created', message: `created a new deal: ${deal.name}` },
        { type: 'deal_updated', message: `updated the deal: ${deal.name}` },
        { type: 'stage_changed', message: `moved ${deal.name} to ${deal.stage}` },
        { type: 'comment_added', message: `commented on ${deal.name}` },
        { type: 'meeting_scheduled', message: `scheduled a meeting for ${deal.name}` }
      ];

      const activity = activityTypes[index % activityTypes.length];

      return {
        id: index + 1,
        type: activity.type,
        user: {
          id: user.id,
          name: user.name,
          avatar: user.avatar
        },
        content: `${user.name} ${activity.message}`,
        timestamp: date.toISOString(),
        relatedDeal: {
          id: deal.id,
          name: deal.name
        }
      };
    });

    // Sort by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Update a deal
router.patch('/deals/:id', authenticateUser, requireDealOwnershipOrAdmin, async (req, res) => {
  try {
    const dealId = parseInt(req.params.id);
    const updateData = req.body;

    console.log(`API: Updating deal ${dealId} with data:`, JSON.stringify(updateData, null, 2));
    console.log(`API: Deal name being updated to:`, updateData.name);

    // Get the current deal to check if it exists
    const deal = await storage.getDealById(dealId);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    // Try a direct SQL update for the name field
    if (updateData.name !== undefined) {
      try {
        const { Pool } = require('pg');
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Postgres2025!@localhost:5432/salesspark'
        });

        // Log the database connection string (with password masked)
        const connString = process.env.DATABASE_URL || 'postgresql://postgres:****@localhost:5432/salesspark';
        console.log(`Using database connection: ${connString}`);

        const client = await pool.connect();
        try {
          // First check if the deal exists
          const checkResult = await client.query('SELECT * FROM deals WHERE id = $1', [dealId]);
          if (checkResult.rows.length > 0) {
            console.log(`Found deal ${dealId} in database:`, checkResult.rows[0]);
          } else {
            console.log(`Deal ${dealId} not found in database!`);
          }

          // Ensure the name is a string
          const dealName = String(updateData.name);
          console.log(`Executing direct SQL update for deal ${dealId} name to "${dealName}" (type: ${typeof dealName})`);

          const result = await client.query(
            'UPDATE deals SET name = $1, updated_at = $2 WHERE id = $3 RETURNING *',
            [dealName, new Date(), dealId]
          );

          if (result.rows.length > 0) {
            console.log('Direct SQL update successful:', result.rows[0]);

            // Use the updated deal from the SQL query
            const directUpdatedDeal = {
              ...deal,
              name: result.rows[0].name,
              updatedAt: result.rows[0].updated_at
            };

            // Create an activity record
            if (storage.createActivity) {
              await storage.createActivity({
                userId: req.user.id,
                type: 'deal_updated',
                content: `Updated deal: ${deal.name} to ${directUpdatedDeal.name}`,
                relatedId: dealId,
                metadata: {
                  previousData: deal,
                  newData: directUpdatedDeal
                }
              });
            }

            return res.json(directUpdatedDeal);
          }
        } finally {
          client.release();
          await pool.end();
        }
      } catch (sqlError) {
        console.error('Direct SQL update failed:', sqlError);
        // Continue with the normal update process
      }
    }

    // Update the deal using the storage provider
    const updatedDeal = await storage.updateDeal(dealId, updateData);

    // Create an activity record for the update
    try {
      if (storage.createActivity) {
        await storage.createActivity({
          userId: req.user.id,
          type: 'deal_updated',
          content: `Updated deal: ${deal.name}`,
          relatedId: dealId,
          metadata: {
            previousData: deal,
            newData: updateData
          }
        });
      }
    } catch (activityError) {
      console.error('Error creating activity record:', activityError);
      // Don't fail the request if activity creation fails
    }

    res.json(updatedDeal);
  } catch (error) {
    console.error('Error updating deal:', error);
    res.status(500).json({
      error: 'Failed to update deal',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete a deal
router.delete('/deals/:id', authenticateUser, async (req, res) => {
  try {
    console.log(`Delete deal request for ID: ${req.params.id} by user:`, req.user);
    const dealId = parseInt(req.params.id);

    // Get the current deal to check if it exists
    const deal = await storage.getDealById(dealId);
    if (!deal) {
      console.log(`Deal with ID ${dealId} not found`);
      return res.status(404).json({ error: 'Deal not found' });
    }

    console.log(`Found deal:`, JSON.stringify(deal, null, 2));

    // Normalize role for comparison
    const userRole = (req.user.role || '').toLowerCase();

    // STRICT POLICY: Only admins can delete deals
    if (userRole !== 'admin' && userRole !== 'administrator' && userRole !== 'superuser') {
      console.log(`Permission denied: User ${req.user.id} (${req.user.role}) tried to delete deal. Only admins can delete deals.`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only administrators can delete deals'
      });
    }

    // Direct database approach for deleting the deal
    // Use the Pool that's already imported at the top of the file
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Postgres2025!@localhost:5432/salesspark'
    });

    const client = await pool.connect();
    let success = false;

    try {
      // Start a transaction
      await client.query('BEGIN');

      console.log(`Starting direct database deletion for deal ${dealId}`);

      // Use a simpler approach with a single transaction
      // First, check if the tables exist and then perform the deletions

      // Check if tables exist
      const tablesQuery = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name IN ('revenue_recognition', 'wip_updates', 'wip', 'installations', 'activities', 'deals')
      `);

      const existingTables = tablesQuery.rows.map(row => row.table_name);
      console.log(`Existing tables: ${existingTables.join(', ')}`);

      // Delete records in the correct order based on existing tables
      // First, check the actual column names in the tables
      console.log('Checking column names in tables...');

      // Get column information for revenue_recognition table if it exists
      let revenueRecognitionColumns = [];
      if (existingTables.includes('revenue_recognition')) {
        const columnQuery = await client.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'revenue_recognition'
        `);
        revenueRecognitionColumns = columnQuery.rows.map(row => row.column_name);
        console.log(`Revenue recognition columns: ${revenueRecognitionColumns.join(', ')}`);
      }

      // Get column information for wip_updates table if it exists
      let wipUpdatesColumns = [];
      if (existingTables.includes('wip_updates')) {
        const columnQuery = await client.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'wip_updates'
        `);
        wipUpdatesColumns = columnQuery.rows.map(row => row.column_name);
        console.log(`WIP updates columns: ${wipUpdatesColumns.join(', ')}`);
      }

      // Only attempt to delete from wip-related tables if wip exists
      if (existingTables.includes('wip')) {
        // First handle tables that depend on wip
        if (existingTables.includes('revenue_recognition')) {
          console.log(`Deleting revenue_recognition records for deal ${dealId}`);

          // Check if wip_id column exists
          if (revenueRecognitionColumns.includes('wip_id')) {
            await client.query(`
              DELETE FROM revenue_recognition
              WHERE wip_id IN (SELECT id FROM wip WHERE deal_id = $1)
            `, [dealId]);
          } else {
            // Try with deal_id if wip_id doesn't exist
            if (revenueRecognitionColumns.includes('deal_id')) {
              await client.query('DELETE FROM revenue_recognition WHERE deal_id = $1', [dealId]);
            } else {
              console.log('Could not find appropriate column in revenue_recognition to delete by');
            }
          }
        }

        if (existingTables.includes('wip_updates')) {
          console.log(`Deleting wip_updates records for deal ${dealId}`);

          // Check if wip_id column exists
          if (wipUpdatesColumns.includes('wip_id')) {
            await client.query(`
              DELETE FROM wip_updates
              WHERE wip_id IN (SELECT id FROM wip WHERE deal_id = $1)
            `, [dealId]);
          } else {
            // Try with deal_id if wip_id doesn't exist
            if (wipUpdatesColumns.includes('deal_id')) {
              await client.query('DELETE FROM wip_updates WHERE deal_id = $1', [dealId]);
            } else {
              console.log('Could not find appropriate column in wip_updates to delete by');
            }
          }
        }

        // Then delete from wip itself
        console.log(`Deleting wip records for deal ${dealId}`);
        await client.query('DELETE FROM wip WHERE deal_id = $1', [dealId]);
      } else {
        console.log('The wip table does not exist, skipping wip-related deletions');
      }

      if (existingTables.includes('installations')) {
        console.log(`Deleting installations records for deal ${dealId}`);
        await client.query('DELETE FROM installations WHERE deal_id = $1', [dealId]);
      }

      if (existingTables.includes('activities')) {
        console.log(`Deleting activities for deal ${dealId}`);
        await client.query('DELETE FROM activities WHERE related_id = $1', [dealId]);
      }

      // Finally, delete the deal itself
      console.log(`Deleting deal ${dealId}`);
      const result = await client.query('DELETE FROM deals WHERE id = $1 RETURNING *', [dealId]);

      if (result.rows.length > 0) {
        console.log(`Deal ${dealId} deleted successfully`);
        success = true;
      } else {
        console.log(`No deal with ID ${dealId} found to delete`);
      }

      // Commit the transaction
      await client.query('COMMIT');

    } catch (dbError) {
      // Rollback the transaction in case of error
      try {
        await client.query('ROLLBACK');
        console.error('Transaction rolled back due to error:', dbError);
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }

      // Try a different approach if the transaction failed
      try {
        console.log('Attempting direct deletion without transaction...');

        // Create a new client for the direct deletion
        const directClient = await pool.connect();

        try {
          // First, check which tables exist
          const tablesCheck = await directClient.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            AND table_name IN ('deals', 'activities', 'installations', 'wip', 'wip_updates', 'revenue_recognition')
          `);

          const tables = tablesCheck.rows.map(row => row.table_name);
          console.log(`Available tables for direct deletion: ${tables.join(', ')}`);

          // Delete from each table directly if it exists
          // Delete in the correct order to avoid foreign key constraint violations

          // First, check the actual column names in the tables
          console.log('Checking column names in tables for direct deletion...');

          // Get column information for revenue_recognition table if it exists
          let revenueRecognitionColumns = [];
          if (tables.includes('revenue_recognition')) {
            const columnQuery = await directClient.query(`
              SELECT column_name
              FROM information_schema.columns
              WHERE table_name = 'revenue_recognition'
            `);
            revenueRecognitionColumns = columnQuery.rows.map(row => row.column_name);
            console.log(`Revenue recognition columns: ${revenueRecognitionColumns.join(', ')}`);
          }

          // Get column information for wip_updates table if it exists
          let wipUpdatesColumns = [];
          if (tables.includes('wip_updates')) {
            const columnQuery = await directClient.query(`
              SELECT column_name
              FROM information_schema.columns
              WHERE table_name = 'wip_updates'
            `);
            wipUpdatesColumns = columnQuery.rows.map(row => row.column_name);
            console.log(`WIP updates columns: ${wipUpdatesColumns.join(', ')}`);
          }

          // First, handle wip-related tables if wip exists
          if (tables.includes('wip')) {
            if (tables.includes('revenue_recognition')) {
              console.log('Directly deleting from revenue_recognition');

              // Check if wip_id column exists
              if (revenueRecognitionColumns.includes('wip_id')) {
                await directClient.query(`
                  DELETE FROM revenue_recognition
                  WHERE wip_id IN (SELECT id FROM wip WHERE deal_id = $1)
                `, [dealId]);
              } else {
                // Try with deal_id if wip_id doesn't exist
                if (revenueRecognitionColumns.includes('deal_id')) {
                  await directClient.query('DELETE FROM revenue_recognition WHERE deal_id = $1', [dealId]);
                } else {
                  console.log('Could not find appropriate column in revenue_recognition to delete by');
                }
              }
            }

            if (tables.includes('wip_updates')) {
              console.log('Directly deleting from wip_updates');

              // Check if wip_id column exists
              if (wipUpdatesColumns.includes('wip_id')) {
                await directClient.query(`
                  DELETE FROM wip_updates
                  WHERE wip_id IN (SELECT id FROM wip WHERE deal_id = $1)
                `, [dealId]);
              } else {
                // Try with deal_id if wip_id doesn't exist
                if (wipUpdatesColumns.includes('deal_id')) {
                  await directClient.query('DELETE FROM wip_updates WHERE deal_id = $1', [dealId]);
                } else {
                  console.log('Could not find appropriate column in wip_updates to delete by');
                }
              }
            }

            console.log('Directly deleting from wip');
            await directClient.query('DELETE FROM wip WHERE deal_id = $1', [dealId]);
          }

          // Handle other tables
          if (tables.includes('installations')) {
            console.log('Directly deleting from installations');
            await directClient.query('DELETE FROM installations WHERE deal_id = $1', [dealId]);
          }

          if (tables.includes('activities')) {
            console.log('Directly deleting from activities');
            await directClient.query('DELETE FROM activities WHERE related_id = $1', [dealId]);
          }

          // Finally delete the deal
          console.log(`Directly deleting deal ${dealId}`);
          const directResult = await directClient.query('DELETE FROM deals WHERE id = $1 RETURNING *', [dealId]);

          if (directResult.rows.length > 0) {
            console.log(`Deal ${dealId} deleted successfully with direct approach`);
            success = true;
          }
        } finally {
          directClient.release();
        }
      } catch (directError) {
        console.error('Direct deletion failed:', directError);
        // Return a more helpful error message to the client
        return res.status(500).json({
          error: 'Failed to delete deal',
          message: directError.message || 'Unknown error',
          details: {
            originalError: dbError.message,
            directError: directError.message
          }
        });
      }
    } finally {
      // Release the client back to the pool
      try {
        client.release();
      } catch (releaseError) {
        console.error('Error releasing client:', releaseError);
      }

      try {
        await pool.end();
      } catch (poolError) {
        console.error('Error ending pool:', poolError);
      }
    }

    if (success) {
      // Create an activity record for the deletion
      try {
        if (storage.createActivity) {
          console.log(`Creating activity record for deal deletion`);
          await storage.createActivity({
            userId: req.user.id,
            type: 'deal_deleted',
            content: `Deleted deal: ${deal.name}`,
            relatedId: dealId,
            metadata: {
              deletedDeal: deal
            }
          });
        }
      } catch (activityError) {
        console.error('Error creating activity record:', activityError);
        // Don't fail the request if activity creation fails
      }

      console.log(`Deal ${dealId} deleted successfully`);
      res.json({
        success: true,
        message: 'Deal deleted successfully'
      });
    } else {
      // Check if the deal exists before returning a 404
      try {
        const checkClient = await pool.connect();
        try {
          const checkResult = await checkClient.query('SELECT id FROM deals WHERE id = $1', [dealId]);
          if (checkResult.rows.length === 0) {
            console.log(`Deal ${dealId} not found in database`);
            res.status(404).json({
              error: 'Deal not found',
              message: `No deal with ID ${dealId} exists in the database`
            });
          } else {
            // Deal exists but couldn't be deleted for some reason
            console.error(`Deal ${dealId} exists but could not be deleted`);
            res.status(500).json({
              error: 'Failed to delete deal',
              message: 'The deal exists but could not be deleted. Please check the server logs for more details.',
              dealId: dealId
            });
          }
        } finally {
          checkClient.release();
        }
      } catch (checkError) {
        console.error('Error checking if deal exists:', checkError);
        res.status(500).json({
          error: 'Failed to delete deal',
          message: 'An error occurred while trying to delete the deal',
          details: checkError instanceof Error ? checkError.message : 'Unknown error'
        });
      }
    }
  } catch (error) {
    console.error('Error deleting deal:', error);
    // Provide more detailed error information
    let errorMessage = 'Unknown error';
    let errorDetails = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        stack: error.stack
      };

      // Check for database-specific error properties
      if ('code' in error) errorDetails.code = error.code;
      if ('detail' in error) errorDetails.detail = error.detail;
      if ('constraint' in error) errorDetails.constraint = error.constraint;
      if ('table' in error) errorDetails.table = error.table;
    }

    console.error('Detailed error information:', errorDetails);

    res.status(500).json({
      error: 'Failed to delete deal',
      message: errorMessage,
      details: errorDetails
    });
  }
});

// Update a deal's stage
router.patch('/deals/:id/stage', authenticateUser, requireDealOwnershipOrAdmin, async (req, res) => {
  try {
    const dealId = parseInt(req.params.id);
    const { stage } = req.body;

    // Validate the stage
    const validStages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({
        error: 'Invalid stage value',
        validStages
      });
    }

    // Get the current deal to check if it exists
    const deal = await storage.getDealById(dealId);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    console.log(`Found deal ${dealId} with current stage: ${deal.stage}, updating to: ${stage}`);

    // Update the deal stage
    const updatedDeal = await storage.updateDealStage(dealId, stage);
    console.log(`Deal stage updated successfully:`, updatedDeal);

    // No need to create installation records for closed won deals anymore

    // Create an activity record for the stage change
    try {
      if (storage.createActivity) {
        await storage.createActivity({
          userId: req.user.id,
          type: 'stage_changed',
          content: `Changed deal stage to ${stage.replace('_', ' ')}`,
          relatedId: dealId,
          metadata: {
            previousStage: deal.stage,
            newStage: stage
          }
        });
        console.log(`Activity record created for stage change`);
      }
    } catch (activityError) {
      console.error('Error creating activity record:', activityError);
      // Don't fail the request if activity creation fails
    }

    res.json(updatedDeal);
  } catch (error) {
    console.error('Error updating deal stage:', error);
    res.status(500).json({
      error: 'Failed to update deal stage',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all targets
router.get('/targets', authenticateUser, async (req, res) => {
  try {
    console.log('Fetching targets');
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;

    let targets;
    if (userId) {
      console.log(`Fetching targets for user ${userId}`);
      targets = await storage.getTargets(userId);
    } else {
      console.log('Fetching all targets');
      targets = await storage.getAllTargets();
    }

    console.log(`Returning ${targets.length} targets`);
    res.json(targets);
  } catch (error) {
    console.error('Error fetching targets:', error);
    res.status(500).json({
      error: 'Failed to fetch targets',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get a specific target
router.get('/targets/:id', authenticateUser, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id);
    const target = await storage.getTargetById(targetId);

    if (!target) {
      return res.status(404).json({ error: 'Target not found' });
    }

    res.json(target);
  } catch (error) {
    console.error('Error fetching target:', error);
    res.status(500).json({
      error: 'Failed to fetch target',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create a new target
router.post('/targets', authenticateUser, async (req, res) => {
  try {
    console.log('Creating new target with data:', req.body);

    // Validate required fields
    const { userId, targetType, period, startDate, endDate, targetValue } = req.body;

    if (!userId || !targetType || !period || !startDate || !endDate || targetValue === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        requiredFields: ['userId', 'targetType', 'period', 'startDate', 'endDate', 'targetValue']
      });
    }

    // Create the target
    const target = await storage.createTarget({
      userId,
      targetType,
      period,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      targetValue: parseFloat(targetValue.toString()),
      currentValue: req.body.currentValue ? parseFloat(req.body.currentValue.toString()) : 0
    });

    console.log('Target created successfully:', target);
    res.status(201).json(target);
  } catch (error) {
    console.error('Error creating target:', error);
    res.status(500).json({
      error: 'Failed to create target',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update a target
router.patch('/targets/:id', authenticateUser, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id);
    console.log(`Updating target ${targetId} with data:`, req.body);

    // Check if the target exists
    const target = await storage.getTargetById(targetId);
    if (!target) {
      return res.status(404).json({ error: 'Target not found' });
    }

    // Process dates if they're provided
    const updateData = { ...req.body };
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    // Update the target
    const updatedTarget = await storage.updateTarget(targetId, updateData);

    console.log('Target updated successfully:', updatedTarget);
    res.json(updatedTarget);
  } catch (error) {
    console.error('Error updating target:', error);
    res.status(500).json({
      error: 'Failed to update target',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete a target
router.delete('/targets/:id', authenticateUser, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id);
    console.log(`Deleting target ${targetId}`);

    // Check if the target exists
    const target = await storage.getTargetById(targetId);
    if (!target) {
      return res.status(404).json({ error: 'Target not found' });
    }

    // Delete the target
    const result = await storage.deleteTarget(targetId);

    if (result) {
      console.log(`Target ${targetId} deleted successfully`);
      res.json({
        success: true,
        message: 'Target deleted successfully'
      });
    } else {
      console.error(`Failed to delete target ${targetId}`);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete target'
      });
    }
  } catch (error) {
    console.error('Error deleting target:', error);
    res.status(500).json({
      error: 'Failed to delete target',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.use('/admin', adminRouter);

export default router;
