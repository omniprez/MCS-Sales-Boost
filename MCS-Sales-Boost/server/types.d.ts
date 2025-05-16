import 'express-session';
import { Request, Response, NextFunction } from 'express';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      session: Session & {
        userId: number;
        user_id?: number; // Legacy support
        isAuthenticated?: boolean;
        role?: string;
      };
    }
  }
}

// Extend Express Session
declare module 'express-session' {
  interface SessionData {
    userId: number;
    user_id?: number; // Legacy support
    isAuthenticated?: boolean;
    role?: string;
  }
}

// For any missing modules
declare module 'drizzle-orm/node-postgres' {
  export function drizzle(client: any, options?: any): any;
}

declare module 'drizzle-orm' {
  export function eq(column: any, value: any): any;
  export function sql(strings: TemplateStringsArray, ...values: any[]): any;
}

declare module 'zod' {
  export class ZodError {
    errors: any[];
  }
  export const z: {
    object: (shape: any) => any;
    string: () => any;
    number: () => any;
  };
  export function object(shape: any): any;
  export function string(): any;
  export function number(): any;
}

// Extend process.env with our environment variables
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: 'development' | 'production' | 'test';
      PORT?: string;
      DATABASE_URL?: string;
      SESSION_SECRET?: string;
      VERCEL?: string;
      USE_IN_MEMORY_DB?: string;
    }
  }
} 