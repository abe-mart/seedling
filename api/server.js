import express from 'express';
import cors from 'cors';
import pg from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3006;
const { Pool } = pg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware
app.use(cors());
app.use(express.json());

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Sign up
app.post('/auth/signup', async (req, res) => {
  const { email, password, displayName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userResult = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, passwordHash]
    );

    const user = userResult.rows[0];

    // Create profile
    await pool.query(
      'INSERT INTO profiles (id, email, display_name) VALUES ($1, $2, $3)',
      [user.id, email, displayName || null]
    );

    // Create user settings
    await pool.query(
      'INSERT INTO user_settings (user_id) VALUES ($1)',
      [user.id]
    );

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Sign in
app.post('/auth/signin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const result = await pool.query(
      'SELECT id, email, password_hash, created_at FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      token,
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Failed to sign in' });
  }
});

// Get current user
app.get('/auth/user', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Get user profile
app.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM profiles WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
app.patch('/profile', authenticateToken, async (req, res) => {
  const { display_name, timezone, preferred_genres, writing_frequency } = req.body;

  try {
    const result = await pool.query(
      `UPDATE profiles 
       SET display_name = COALESCE($1, display_name),
           timezone = COALESCE($2, timezone),
           preferred_genres = COALESCE($3, preferred_genres),
           writing_frequency = COALESCE($4, writing_frequency),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [display_name, timezone, preferred_genres, writing_frequency, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Generic CRUD endpoints for other tables
const tables = ['series', 'books', 'story_elements', 'prompts', 'responses', 'user_settings'];

tables.forEach(table => {
  // Get all items for current user
  app.get(`/${table}`, authenticateToken, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM ${table} WHERE user_id = $1 ORDER BY created_at DESC`,
        [req.user.id]
      );
      res.json(result.rows);
    } catch (error) {
      console.error(`Get ${table} error:`, error);
      res.status(500).json({ error: `Failed to get ${table}` });
    }
  });

  // Get single item
  app.get(`/${table}/:id`, authenticateToken, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM ${table} WHERE id = $1 AND user_id = $2`,
        [req.params.id, req.user.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error(`Get ${table} item error:`, error);
      res.status(500).json({ error: `Failed to get ${table} item` });
    }
  });

  // Create item
  app.post(`/${table}`, authenticateToken, async (req, res) => {
    try {
      const data = { ...req.body, user_id: req.user.id };
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

      const result = await pool.query(
        `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`,
        values
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(`Create ${table} error:`, error);
      res.status(500).json({ error: `Failed to create ${table}` });
    }
  });

  // Update item
  app.patch(`/${table}/:id`, authenticateToken, async (req, res) => {
    try {
      const updates = Object.keys(req.body)
        .map((key, i) => `${key} = $${i + 1}`)
        .join(', ');
      const values = [...Object.values(req.body), req.params.id, req.user.id];

      const result = await pool.query(
        `UPDATE ${table} SET ${updates}, updated_at = NOW() WHERE id = $${values.length - 1} AND user_id = $${values.length} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error(`Update ${table} error:`, error);
      res.status(500).json({ error: `Failed to update ${table}` });
    }
  });

  // Delete item
  app.delete(`/${table}/:id`, authenticateToken, async (req, res) => {
    try {
      const result = await pool.query(
        `DELETE FROM ${table} WHERE id = $1 AND user_id = $2 RETURNING id`,
        [req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Not found' });
      }

      res.json({ success: true, id: result.rows[0].id });
    } catch (error) {
      console.error(`Delete ${table} error:`, error);
      res.status(500).json({ error: `Failed to delete ${table}` });
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API server running on http://0.0.0.0:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});
