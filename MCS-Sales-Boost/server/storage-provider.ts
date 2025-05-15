import { PgStorage } from './pg-storage';
import dotenv from 'dotenv';

dotenv.config();

let storage: PgStorage;

try {
  // Attempt to use PostgreSQL if DATABASE_URL is set
  if (process.env.DATABASE_URL) {
    console.log('Attempting to connect to PostgreSQL with URL:', process.env.DATABASE_URL);
    storage = new PgStorage();

    // Verify that the deleteDeal method exists
    if (!storage.deleteDeal) {
      console.error('deleteDeal method is missing from PgStorage!');
      throw new Error('deleteDeal method is missing from PgStorage');
    } else {
      console.log('deleteDeal method exists in PgStorage');
    }
  } else {
    throw new Error('DATABASE_URL not provided');
  }
} catch (error) {
  console.error('Error initializing storage:', error);
  process.exit(1);
}

export { storage };
