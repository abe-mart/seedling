import dotenv from 'dotenv';
dotenv.config();

import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

console.log('🔐 Initializing Better Auth...');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('BETTER_AUTH_SECRET exists:', !!process.env.BETTER_AUTH_SECRET);

// Better Auth configuration with PostgreSQL
export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:5173',
  ],
});

// Middleware to verify session
export const requireAuth = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    });
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    req.user = session.user;
    req.session = session.session;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
};

export default auth;
