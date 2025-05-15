import { z } from 'zod';

// Helper function to determine if we're in production
const isProduction = () => {
  return window.location.hostname !== 'localhost' && 
         window.location.hostname !== '127.0.0.1';
};

// Get base URL for API calls
const getApiBaseUrl = () => {
  // In production, use relative URLs to avoid CORS issues
  if (isProduction()) {
    return '';
  }
  
  // Otherwise use the environment variable or default to localhost
  return import.meta.env.VITE_API_URL || 'http://localhost:5000';
};

const envSchema = z.object({
  VITE_API_URL: z.string().default('http://localhost:5000'),
});

const env = envSchema.parse(import.meta.env);

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    CHECK: '/api/auth/check',
  },
  PIPELINE: '/api/pipeline',
  DEALS: '/api/deals',
} as const;