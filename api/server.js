import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3006;
const { Pool } = pg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err.stack);
  } else {
    console.log('✅ Database connected successfully');
    release();
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get profile
app.get('/profile', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM profile LIMIT 1');
    
    if (result.rows.length === 0) {
      // Create default profile if none exists
      const newProfile = await pool.query(
        'INSERT INTO profile (display_name) VALUES ($1) RETURNING *',
        ['Writer']
      );
      res.json(newProfile.rows[0]);
    } else {
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update profile
app.patch('/profile', async (req, res) => {
  const { display_name, timezone, preferred_genres, writing_frequency } = req.body;

  try {
    // Get the profile ID
    const profileResult = await pool.query('SELECT id FROM profile LIMIT 1');
    
    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const profileId = profileResult.rows[0].id;

    const result = await pool.query(
      `UPDATE profile 
       SET display_name = COALESCE($1, display_name),
           timezone = COALESCE($2, timezone),
           preferred_genres = COALESCE($3, preferred_genres),
           writing_frequency = COALESCE($4, writing_frequency),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [display_name, timezone, preferred_genres, writing_frequency, profileId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user settings
app.get('/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM user_settings LIMIT 1');
    
    if (result.rows.length === 0) {
      // Create default settings if none exists
      const newSettings = await pool.query(
        'INSERT INTO user_settings DEFAULT VALUES RETURNING *'
      );
      res.json(newSettings.rows[0]);
    } else {
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Update user settings
app.patch('/settings', async (req, res) => {
  const { default_prompt_mode, daily_reminder_enabled, reminder_time, dark_mode } = req.body;

  try {
    const settingsResult = await pool.query('SELECT id FROM user_settings LIMIT 1');
    
    if (settingsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    const settingsId = settingsResult.rows[0].id;

    const result = await pool.query(
      `UPDATE user_settings 
       SET default_prompt_mode = COALESCE($1, default_prompt_mode),
           daily_reminder_enabled = COALESCE($2, daily_reminder_enabled),
           reminder_time = COALESCE($3, reminder_time),
           dark_mode = COALESCE($4, dark_mode),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [default_prompt_mode, daily_reminder_enabled, reminder_time, dark_mode, settingsId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Generic CRUD endpoints for tables
const tables = ['series', 'books', 'story_elements', 'prompts', 'responses'];

tables.forEach(table => {
  // Get all items
  app.get(`/${table}`, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM ${table} ORDER BY created_at DESC`
      );
      res.json(result.rows);
    } catch (error) {
      console.error(`Get ${table} error:`, error);
      res.status(500).json({ error: `Failed to get ${table}` });
    }
  });

  // Get single item
  app.get(`/${table}/:id`, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM ${table} WHERE id = $1`,
        [req.params.id]
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
  app.post(`/${table}`, async (req, res) => {
    try {
      const data = req.body;
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
      res.status(500).json({ error: `Failed to create ${table}`, details: error.message });
    }
  });

  // Update item
  app.patch(`/${table}/:id`, async (req, res) => {
    try {
      const data = req.body;
      const updates = Object.keys(data)
        .map((key, i) => `${key} = $${i + 1}`)
        .join(', ');
      const values = [...Object.values(data), req.params.id];

      const result = await pool.query(
        `UPDATE ${table} SET ${updates}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
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
  app.delete(`/${table}/:id`, async (req, res) => {
    try {
      const result = await pool.query(
        `DELETE FROM ${table} WHERE id = $1 RETURNING id`,
        [req.params.id]
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
  console.log(`Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});
