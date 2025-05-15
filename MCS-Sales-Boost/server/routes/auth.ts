/**
 * Authentication Routes
 * Last updated: 2025-05-11 07:21:57 UTC
 * Author: omniprez
 */

import express from   'express';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

// Login route
router.post('/login', async (req, res) => {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Login attempt initiated`);

  try {
    // Validate request body
    console.log('Validating request body:', { ...req.body, password: '[FILTERED]' });
    const { username, password } = loginSchema.parse(req.body);

    // Normalize username
    const normalizedUsername = username.toLowerCase();
    console.log('Attempting login for:', normalizedUsername);

    // Query user from database
    const userResults = await db.select()
      .from(users)
      .where(sql`LOWER(username) = ${normalizedUsername}`)
      .limit(1);

    console.log(`User query completed in ${Date.now() - startTime}ms`);

    // User not found
    if (!userResults || userResults.length === 0) {
      console.log(`User not found: ${username}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const user = userResults[0];
    console.log('User found, stored password hash:', { hash_length: user.password?.length || 0 });

    // Verify password
    try {
      if (!user.password) {
        console.error('User password hash is null or undefined');
        return res.status(500).json({
          success: false,
          error: 'Account configuration error'
        });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      console.log('Password validation completed:', validPassword);

      if (!validPassword) {
        console.log(`Invalid password for user: ${username}`);
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }
    } catch (passwordError) {
      console.error('Password validation error:', passwordError);
      return res.status(500).json({
        success: false,
        error: 'Error validating credentials',
        details: passwordError.message || 'Unknown error'
      });
    }

    // Set session data
    req.session.userId = user.id;
    req.session.user_id = user.id; // Legacy support
    req.session.isAuthenticated = true;
    req.session.role = user.role || 'sales_rep';

    // Save session explicitly
    try {
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            reject(err);
          } else {
            console.log('Session saved successfully');
            resolve();
          }
        });
      });

      // Verify session was saved
      console.log('Session state after save:', {
        id: req.sessionID,
        userId: req.session.userId,
        isAuthenticated: req.session.isAuthenticated,
        role: req.session.role
      });
    } catch (sessionError) {
      console.error('Session save failed:', sessionError);
      return res.status(500).json({
        success: false,
        error: 'Failed to establish session'
      });
    }

    // Return success response
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      success: true,
      user: {
        ...userWithoutPassword,
        role: user.role || 'sales_rep'
      }
    });

    console.log(`Login successful for user: ${username} (${Date.now() - startTime}ms)`);
  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  console.log(`[${new Date().toISOString()}] Logout initiated for session:`, req.sessionID);

  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to logout'
        });
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    });
  } else {
    console.log('No session found during logout');
    res.json({
      success: true,
      message: 'Already logged out'
    });
  }
});

// Auth check route
router.get('/check', async (req, res) => {
  console.log(`[${new Date().toISOString()}] Auth check for session:`, req.sessionID);

  try {
    // Check session state
    if (!req.session?.isAuthenticated || !req.session?.userId) {
      console.log('No valid session found');
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    // Get user data
    const userResults = await db.select()
      .from(users)
      .where(eq(users.id, req.session.userId))
      .limit(1);

    if (!userResults || userResults.length === 0) {
      console.log('User not found in database');
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = userResults[0];
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      isAuthenticated: true,
      user: {
        ...userWithoutPassword,
        role: user.role || 'sales_rep'
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;