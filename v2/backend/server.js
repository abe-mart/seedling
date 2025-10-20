import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { auth, requireAuth } from './auth.js';
import { pool } from './db.js';
import { generateAIPrompt, getAvailableModes, enhanceElementDescription } from './api/openai.js';
import { toNodeHandler } from 'better-auth/node';

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

// Auth routes - handled by Better Auth with Node.js adapter
app.all('/api/auth/*', toNodeHandler(auth));

// ==================== PROFILES ====================

app.get('/api/profile', requireAuth, async (req, res) => {
  try {
    let result = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [req.user.id]
    );
    
    // If profile doesn't exist, create it with user's name from Better Auth
    if (result.rows.length === 0) {
      const insertResult = await pool.query(
        `INSERT INTO profiles (user_id, email, display_name)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [req.user.id, req.user.email, req.user.name || req.user.email.split('@')[0]]
      );
      result = insertResult;
    }
    
    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.put('/api/profile', requireAuth, async (req, res) => {
  const { 
    display_name, 
    timezone, 
    preferred_genres, 
    writing_frequency,
    current_streak,
    longest_streak,
    last_prompt_date
  } = req.body;
  try {
    // First ensure profile exists
    let existingProfile = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [req.user.id]
    );
    
    // Create profile if it doesn't exist
    if (existingProfile.rows.length === 0) {
      await pool.query(
        `INSERT INTO profiles (user_id, email, display_name)
         VALUES ($1, $2, $3)`,
        [req.user.id, req.user.email, req.user.name || req.user.email.split('@')[0]]
      );
    }
    
    // Now update the profile
    const result = await pool.query(
      `UPDATE profiles 
       SET display_name = COALESCE($1, display_name), 
           timezone = COALESCE($2, timezone), 
           preferred_genres = COALESCE($3, preferred_genres), 
           writing_frequency = COALESCE($4, writing_frequency),
           current_streak = COALESCE($5, current_streak),
           longest_streak = COALESCE($6, longest_streak),
           last_prompt_date = COALESCE($7, last_prompt_date),
           updated_at = NOW()
       WHERE user_id = $8
       RETURNING *`,
      [display_name, timezone, preferred_genres, writing_frequency, current_streak, longest_streak, last_prompt_date, req.user.id]
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

app.delete('/api/books/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    // Verify ownership before deleting
    const ownerCheck = await pool.query(
      'SELECT user_id FROM books WHERE id = $1',
      [id]
    );
    
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    if (ownerCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Delete the book (cascade will handle related elements, prompts, etc.)
    await pool.query('DELETE FROM books WHERE id = $1', [id]);
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Failed to delete book' });
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
    const result = await generateAIPrompt({
      promptMode,
      storyContext,
      selectedElements,
      availableElements,
      elementHistory
    });
    
    // Return both the prompt and the elements that were actually used
    res.json({ 
      prompt: result.prompt,
      usedElements: result.usedElements 
    });
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

app.post('/api/enhance-element-description', requireAuth, async (req, res) => {
  const { elementId } = req.body;
  
  try {
    // Fetch the element
    const elementResult = await pool.query(
      'SELECT * FROM story_elements WHERE id = $1 AND user_id = $2',
      [elementId, req.user.id]
    );
    
    if (elementResult.rows.length === 0) {
      return res.status(404).json({ error: 'Element not found' });
    }
    
    const element = elementResult.rows[0];
    
    // Fetch all prompts that reference this element
    const promptsResult = await pool.query(
      'SELECT * FROM prompts WHERE user_id = $1 AND $2 = ANY(element_references) ORDER BY created_at DESC',
      [req.user.id, elementId]
    );
    
    // Fetch responses for these prompts
    const promptIds = promptsResult.rows.map(p => p.id);
    let promptsAndResponses = [];
    
    if (promptIds.length > 0) {
      const responsesResult = await pool.query(
        'SELECT * FROM responses WHERE prompt_id = ANY($1::uuid[]) ORDER BY created_at DESC',
        [promptIds]
      );
      
      // Combine prompts with their responses
      promptsAndResponses = promptsResult.rows.map(prompt => ({
        prompt_text: prompt.prompt_text,
        prompt_type: prompt.prompt_type,
        response_text: responsesResult.rows.find(r => r.prompt_id === prompt.id)?.response_text || null
      }));
    }
    
    // Generate enhanced description
    const result = await enhanceElementDescription({
      element,
      promptsAndResponses
    });
    
    res.json({ enhancedDescription: result.enhancedDescription });
  } catch (error) {
    console.error('Error enhancing element description:', error);
    res.status(500).json({ error: 'Failed to enhance description' });
  }
});

// ==================== DAILY PROMPTS ====================

import {
  getUserPreferences,
  updateUserPreferences,
  getPromptLog,
  markPromptOpened,
  markPromptResponded,
  markPromptSkipped,
  selectPromptForUser
} from './services/dailyPromptsService.js';
import { verifyMagicLinkToken, sendDailyPromptEmail } from './services/emailService.js';

// Get user's daily prompt preferences
app.get('/api/daily-prompts/preferences', requireAuth, async (req, res) => {
  try {
    const preferences = await getUserPreferences(req.user.id);
    res.json(preferences);
  } catch (error) {
    console.error('Error getting daily prompt preferences:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// Update user's daily prompt preferences
app.put('/api/daily-prompts/preferences', requireAuth, async (req, res) => {
  try {
    const preferences = await updateUserPreferences(req.user.id, req.body);
    res.json(preferences);
  } catch (error) {
    console.error('Error updating daily prompt preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Send a test email
app.post('/api/daily-prompts/send-test-email', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    
    // Get user preferences
    const preferences = await getUserPreferences(userId);
    
    if (!preferences.enabled) {
      return res.status(400).json({ 
        error: 'Daily prompts are not enabled. Please enable them first.' 
      });
    }
    
    // Get user's books to select a prompt
    const { rows: books } = await pool.query(
      'SELECT * FROM books WHERE user_id = $1 LIMIT 1',
      [userId]
    );
    
    if (books.length === 0) {
      return res.status(400).json({ 
        error: 'No books found. Create a book with story elements first.' 
      });
    }
    
    // Select a prompt for the user
    const promptData = await selectPromptForUser(userId, preferences);
    
    if (!promptData) {
      return res.status(400).json({ 
        error: 'Could not generate a prompt. Make sure you have story elements in your book.' 
      });
    }
    
    // Create a log entry for the test email
    const { rows: [promptLog] } = await pool.query(
      `INSERT INTO daily_prompts_sent (user_id, prompt_id, element_id, email_format, sent_at, is_test)
       VALUES ($1, $2, $3, $4, NOW(), true)
       RETURNING id`,
      [userId, promptData.prompt.id, promptData.element.id, preferences.email_format]
    );
    
    // Send the email
    const resendEmailId = await sendDailyPromptEmail(
      userEmail,
      { ...promptData, promptLogId: promptLog.id },
      preferences
    );
    
    // Update log with Resend email ID
    await pool.query(
      'UPDATE daily_prompts_sent SET resend_email_id = $1 WHERE id = $2',
      [resendEmailId, promptLog.id]
    );
    
    res.json({ 
      success: true, 
      message: 'Test email sent! Check your inbox (and spam folder).',
      emailId: resendEmailId 
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

// Get prompt details by log ID (with magic link token)
app.get('/api/daily-prompts/:logId', async (req, res) => {
  try {
    const { logId } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }

    // Verify token
    const payload = verifyMagicLinkToken(token);
    if (!payload || payload.promptLogId !== parseInt(logId)) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get prompt details
    const promptLog = await getPromptLog(logId);
    
    if (!promptLog) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    if (promptLog.user_id !== payload.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Mark as opened if not already
    if (!promptLog.opened_at) {
      await markPromptOpened(logId);
    }

    res.json(promptLog);
  } catch (error) {
    console.error('Error getting prompt:', error);
    res.status(500).json({ error: 'Failed to get prompt' });
  }
});

// Submit response to daily prompt (with magic link token)
app.post('/api/daily-prompts/:logId/respond', async (req, res) => {
  try {
    const { logId } = req.params;
    const { token, responseText } = req.body;

    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }

    // Verify token
    const payload = verifyMagicLinkToken(token);
    if (!payload || payload.promptLogId !== parseInt(logId)) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get prompt details
    const promptLog = await getPromptLog(logId);
    
    if (!promptLog) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    if (promptLog.user_id !== payload.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Create response
    const result = await pool.query(
      `INSERT INTO responses (prompt_id, user_id, response_text, element_tags, word_count, completed_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [
        promptLog.prompt_id,
        promptLog.user_id,
        responseText,
        promptLog.element_references,
        responseText.split(/\s+/).filter(w => w).length
      ]
    );

    // Mark prompt as responded
    await markPromptResponded(logId, result.rows[0].id);

    res.json({ success: true, response: result.rows[0] });
  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({ error: 'Failed to submit response' });
  }
});

// Skip daily prompt (with magic link token)
app.post('/api/daily-prompts/skip/:logId', async (req, res) => {
  try {
    const { logId } = req.params;
    const { token } = req.query;
    const { reason } = req.body;

    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }

    // Verify token
    const payload = verifyMagicLinkToken(token);
    if (!payload || payload.promptLogId !== parseInt(logId)) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get prompt details
    const promptLog = await getPromptLog(logId);
    
    if (!promptLog) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    if (promptLog.user_id !== payload.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Mark as skipped
    const result = await markPromptSkipped(logId, reason || 'User skipped');

    res.json({ success: true, paused: result.paused });
  } catch (error) {
    console.error('Error skipping prompt:', error);
    res.status(500).json({ error: 'Failed to skip prompt' });
  }
});

// Get user's daily prompt history
app.get('/api/daily-prompts/history', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT dps.*, p.prompt_text, p.prompt_type,
              se.name as element_name, b.title as book_title,
              r.response_text, r.word_count
       FROM daily_prompts_sent dps
       JOIN prompts p ON dps.prompt_id = p.id
       LEFT JOIN story_elements se ON dps.element_id = se.id
       LEFT JOIN books b ON p.book_id = b.id
       LEFT JOIN responses r ON dps.response_id = r.id
       WHERE dps.user_id = $1
       ORDER BY dps.sent_at DESC
       LIMIT 30`,
      [req.user.id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error getting prompt history:', error);
    res.status(500).json({ error: 'Failed to get history' });
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
