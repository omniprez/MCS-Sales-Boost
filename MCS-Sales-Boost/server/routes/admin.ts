import express from 'express';
import { authenticateUser, requireAdmin } from '../middleware/auth';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { db } from '../db';
import { z } from 'zod';
import { deals, customers } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const dealSchema = z.object({
  mrc: z.string().transform(val => Number(val)),
  nrc: z.string().transform(val => Number(val)),
  contractLength: z.string().transform(val => Number(val)),
  category: z.string(),
  stage: z.string(),
  customerName: z.string(),
  clientType: z.string(),
  dealType: z.string()
});

router.post('/bulk-upload-deals', authenticateUser, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!db) {
      return res.status(500).json({ error: 'Database not initialized' });
    }

    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const fileContent = req.file.buffer.toString();
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

    const validatedRecords = [];
    const errors = [];
    
    for (const record of records) {
      try {
        const validatedData = dealSchema.parse(record);
        const tcv = (validatedData.mrc * validatedData.contractLength) + validatedData.nrc;
        
        // Create customer if it doesn't exist
        const existingCustomer = await db.select().from(customers)
          .where(eq(customers.name, validatedData.customerName))
          .limit(1);

        let customerId;
        if (existingCustomer.length > 0) {
          customerId = existingCustomer[0].id;
        } else {
          const [newCustomer] = await db.insert(customers).values({
            name: validatedData.customerName,
            industry: validatedData.clientType
          }).returning();
          customerId = newCustomer.id;
        }

        // Insert the deal
        const [newDeal] = await db.insert(deals).values({
          customer_id: customerId,
          mrc: validatedData.mrc,
          nrc: validatedData.nrc,
          tcv,
          contract_length: validatedData.contractLength,
          category: validatedData.category,
          stage: validatedData.stage,
          deal_type: validatedData.dealType,
          client_type: validatedData.clientType,
          user_id: req.user.id,
          created_at: new Date(),
          updated_at: new Date()
        }).returning();

        validatedRecords.push(newDeal);
      } catch (err) {
        console.error('Error processing record:', err);
        errors.push({
          record,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Successfully processed ${validatedRecords.length} deals`,
      deals: validatedRecords,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (err) {
    console.error('Error in bulk upload:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during bulk upload',
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});

export default router; 