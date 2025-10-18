import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { auth, requireAuth } from './auth.js';
import { pool } from './db.js';
import { generateAIPrompt, getAvailableModes } from './api/openai.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'StorySeed API is running' });
});

// Auth routes - handled by Better Auth
app.all('/api/auth/*', (req, res) => auth.handler(req, res));

// ==================== PROFILES ====================

app.get('/api/profile', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [req.user.id]
    );
    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.put('/api/profile', requireAuth, async (req, res) => {
  const { display_name, timezone, preferred_genres, writing_frequency } = req.body;
  try {
    const result = await pool.query(
      `UPDATE profiles 
       SET display_name = $1, timezone = $2, preferred_genres = $3, writing_frequency = $4, updated_at = NOW()
       WHERE user_id = $5
       RETURNING *`,
      [display_name, timezone, preferred_genres, writing_frequency, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ==================== SERIES ====================

app.get('/api/series', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM series WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching series:', error);
    res.status(500).json({ error: 'Failed to fetch series' });
  }
});

app.post('/api/series', requireAuth, async (req, res) => {
  const { title, description } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO series (user_id, title, description) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, title, description || '']
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating series:', error);
    res.status(500).json({ error: 'Failed to create series' });
  }
});

// ==================== BOOKS ====================

app.get('/api/books', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM books WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

app.post('/api/books', requireAuth, async (req, res) => {
  const { title, description, series_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO books (user_id, series_id, title, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, series_id || null, title, description || '']
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ error: 'Failed to create book' });
  }
});

// ==================== STORY ELEMENTS ====================

app.get('/api/elements', requireAuth, async (req, res) => {
  const { book_id } = req.query;
  try {
    const result = await pool.query(
      'SELECT * FROM story_elements WHERE book_id = $1 AND user_id = $2 ORDER BY created_at DESC',
      [book_id, req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching elements:', error);
    res.status(500).json({ error: 'Failed to fetch elements' });
  }
});

app.get('/api/elements/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM story_elements WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('Error fetching element:', error);
    res.status(500).json({ error: 'Failed to fetch element' });
  }
});

app.post('/api/elements', requireAuth, async (req, res) => {
  const { book_id, element_type, name, description, notes, metadata } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO story_elements (book_id, user_id, element_type, name, description, notes, metadata) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [book_id, req.user.id, element_type, name, description || '', notes || '', metadata || {}]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating element:', error);
    res.status(500).json({ error: 'Failed to create element' });
  }
});

app.put('/api/elements/:id', requireAuth, async (req, res) => {
  const { name, description, notes, metadata } = req.body;
  try {
    const result = await pool.query(
      `UPDATE story_elements 
       SET name = $1, description = $2, notes = $3, metadata = $4, updated_at = NOW()
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [name, description, notes, metadata, req.params.id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating element:', error);
    res.status(500).json({ error: 'Failed to update element' });
  }
});

app.delete('/api/elements/:id', requireAuth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM story_elements WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting element:', error);
    res.status(500).json({ error: 'Failed to delete element' });
  }
});

// ==================== PROMPTS ====================

app.get('/api/prompts', requireAuth, async (req, res) => {
  const { book_id, limit } = req.query;
  try {
    let query = 'SELECT * FROM prompts WHERE user_id = $1';
    const params = [req.user.id];
    
    if (book_id) {
      query += ' AND book_id = $2';
      params.push(book_id);
    }
    
    query += ' ORDER BY generated_at DESC';
    
    if (limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(parseInt(limit));
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({ error: 'Failed to fetch prompts' });
  }
});

app.get('/api/prompts/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM prompts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('Error fetching prompt:', error);
    res.status(500).json({ error: 'Failed to fetch prompt' });
  }
});

app.post('/api/prompts', requireAuth, async (req, res) => {
  const { book_id, prompt_text, prompt_type, prompt_mode, element_references } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO prompts (user_id, book_id, prompt_text, prompt_type, prompt_mode, element_references, generated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [req.user.id, book_id || null, prompt_text, prompt_type || 'general', prompt_mode || 'general', element_references || []]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating prompt:', error);
    res.status(500).json({ error: 'Failed to create prompt' });
  }
});

// ==================== RESPONSES ====================

app.get('/api/responses', requireAuth, async (req, res) => {
  const { prompt_id } = req.query;
  try {
    const result = await pool.query(
      'SELECT * FROM responses WHERE prompt_id = $1 AND user_id = $2 ORDER BY created_at ASC',
      [prompt_id, req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

app.post('/api/responses', requireAuth, async (req, res) => {
  const { prompt_id, response_text, element_tags, word_count } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO responses (prompt_id, user_id, response_text, element_tags, word_count, completed_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [prompt_id, req.user.id, response_text, element_tags || [], word_count || 0]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating response:', error);
    res.status(500).json({ error: 'Failed to create response' });
  }
});

app.put('/api/responses/:id', requireAuth, async (req, res) => {
  const { response_text, element_tags, word_count } = req.body;
  try {
    const result = await pool.query(
      `UPDATE responses 
       SET response_text = $1, element_tags = $2, word_count = $3, updated_at = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [response_text, element_tags, word_count, req.params.id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating response:', error);
    res.status(500).json({ error: 'Failed to update response' });
  }
});

// ==================== AI / OPENAI ====================

app.post('/api/generate-prompt', requireAuth, async (req, res) => {
  const { promptMode, storyContext, selectedElements, availableElements, elementHistory } = req.body;
  
  try {
    const prompt = await generateAIPrompt({
      promptMode,
      storyContext,
      selectedElements,
      availableElements,
      elementHistory
    });
    
    res.json({ prompt });
  } catch (error) {
    console.error('Error generating AI prompt:', error);
    res.status(500).json({ error: 'Failed to generate prompt' });
  }
});

app.post('/api/available-modes', requireAuth, async (req, res) => {
  const { elements } = req.body;
  try {
    const modes = getAvailableModes(elements);
    res.json({ modes });
  } catch (error) {
    console.error('Error getting available modes:', error);
    res.status(500).json({ error: 'Failed to get available modes' });
  }
});

// ==================== SERVE FRONTEND ====================

// Serve static files from the React app (AFTER all API routes)
app.use(express.static(path.join(__dirname, '../dist')));

// The "catchall" handler: for any request that doesn't match API routes,
// send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🌱 StorySeed Server Running
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server: http://localhost:${PORT}
🌍 Network: http://0.0.0.0:${PORT}
🔐 Auth: Better Auth
🗄️  Database: PostgreSQL
🤖 AI: OpenAI GPT-4o-mini
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});
