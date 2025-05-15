import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().default('http://localhost:5000'),
});

const env = envSchema.parse(import.meta.env);

export const API_BASE_URL = env.VITE_API_URL;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    CHECK: '/api/auth/check',
  },
  PIPELINE: '/api/pipeline',
  DEALS: '/api/deals',
} as const;