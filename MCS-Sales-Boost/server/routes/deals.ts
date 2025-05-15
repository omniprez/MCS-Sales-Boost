import express from 'express';
import { db } from '../db';
import { deals } from '../../shared/schema';
import { authenticateUser } from '../middleware/auth';

const router = express.Router();

// Create a new deal
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { mrc, nrc, contractLength, status, customerId, category, clientType } = req.body;
    
    // Validate required fields
    if (!mrc || !contractLength || !customerId || !category || !clientType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get the user ID from the authenticated session
    const userId = req.session.userId;

    if (!db) {
      throw new Error('Database not initialized');
    }

    // Calculate TCV: (MRC * Contract Length) + NRC
    const tcv = (mrc * contractLength) + (nrc || 0);

    const [newDeal] = await db.insert(deals).values({
      mrc,
      nrc: nrc || 0,
      tcv,
      category,
      stage: status,
      customer_id: customerId,
      user_id: userId,
      client_type: clientType,
      contract_length: contractLength,
      created_at: new Date(),
      updated_at: new Date()
    }).returning();

    res.status(201).json(newDeal);
  } catch (error) {
    console.error('Error creating deal:', error);
    res.status(500).json({ error: 'Failed to create deal' });
  }
});

// Get all deals
router.get('/', authenticateUser, async (req, res) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const allDeals = await db.select().from(deals);
    res.json(allDeals);
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

export default router;

