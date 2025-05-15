import { defineConfig } from "drizzle-kit";
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL not found in environment variables");
}

export default defineConfig({
  schema: "./shared/schema.ts",
  out: "./migrations",
  driver: "better-sqlite",  // This is one of the valid drivers
  dialect: "postgresql",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
});
