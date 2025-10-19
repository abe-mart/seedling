import db from '../db.js';
import { generateAIPrompt } from '../api/openai.js';

/**
 * Intelligent prompt selection that prioritizes underdeveloped story elements
 */
export async function selectPromptForUser(userId, preferences) {
  try {
    // Get user's books (filtered by focus_story_id if set)
    const booksQuery = preferences.focus_story_id
      ? `SELECT id, title FROM books WHERE user_id = $1 AND id = $2`
      : `SELECT id, title FROM books WHERE user_id = $1`;
    
    const booksParams = preferences.focus_story_id
      ? [userId, preferences.focus_story_id]
      : [userId];
    
    const { rows: books } = await db.query(booksQuery, booksParams);
    
    if (books.length === 0) {
      return null; // No books to generate prompts for
    }

    // Get all story elements for these books
    const bookIds = books.map(b => b.id);
    const { rows: elements } = await db.query(
      `SELECT se.id, se.book_id, se.element_type, se.name, se.description, se.notes,
              COUNT(DISTINCT r.id) as response_count,
              MAX(r.created_at) as last_response_at
       FROM story_elements se
       LEFT JOIN prompts p ON se.id = ANY(p.element_references)
       LEFT JOIN responses r ON p.id = r.prompt_id
       WHERE se.book_id = ANY($1) AND se.user_id = $2
       GROUP BY se.id
       ORDER BY response_count ASC, last_response_at ASC NULLS FIRST`,
      [bookIds, userId]
    );

    if (elements.length === 0) {
      return null; // No elements to generate prompts for
    }

    // Filter elements by prompt type preferences
    const typeMap = {
      'character': preferences.include_character,
      'location': preferences.include_worldbuilding,
      'plot_point': preferences.include_plot,
      'item': preferences.include_worldbuilding,
      'theme': preferences.include_conflict
    };

    let eligibleElements = elements.filter(el => typeMap[el.element_type] !== false);
    
    if (eligibleElements.length === 0) {
      eligibleElements = elements; // Fall back to all elements if filters are too restrictive
    }

    // If focus_underdeveloped is true, prioritize elements with fewer responses
    let selectedElement;
    if (preferences.focus_underdeveloped && eligibleElements.length > 0) {
      // Get elements in the bottom 30% by response count
      const sortedByCount = [...eligibleElements].sort((a, b) => a.response_count - b.response_count);
      const cutoff = Math.ceil(sortedByCount.length * 0.3);
      const underdeveloped = sortedByCount.slice(0, Math.max(cutoff, 1));
      selectedElement = underdeveloped[Math.floor(Math.random() * underdeveloped.length)];
    } else {
      selectedElement = eligibleElements[Math.floor(Math.random() * eligibleElements.length)];
    }

    // Get recent prompts to avoid repetition
    const recentDays = preferences.avoid_repetition_days || 7;
    const { rows: recentPrompts } = await db.query(
      `SELECT DISTINCT p.prompt_type, p.element_references
       FROM daily_prompts_sent dps
       JOIN prompts p ON dps.prompt_id = p.id
       WHERE dps.user_id = $1 
       AND dps.sent_at > NOW() - INTERVAL '${recentDays} days'`,
      [userId]
    );

    // Determine prompt types to avoid
    const recentTypes = new Set(recentPrompts.map(p => p.prompt_type));
    const recentElementIds = new Set(
      recentPrompts.flatMap(p => p.element_references || [])
    );

    // Select prompt type
    const availableTypes = [];
    const typeMapping = {
      'character_deep_dive': preferences.include_character,
      'plot_development': preferences.include_plot,
      'worldbuilding': preferences.include_worldbuilding,
      'dialogue': preferences.include_dialogue,
      'conflict_theme': preferences.include_conflict,
      'general': preferences.include_general
    };

    for (const [type, enabled] of Object.entries(typeMapping)) {
      if (enabled && !recentTypes.has(type)) {
        availableTypes.push(type);
      }
    }

    // If all types were recent, allow any enabled type
    if (availableTypes.length === 0) {
      for (const [type, enabled] of Object.entries(typeMapping)) {
        if (enabled) availableTypes.push(type);
      }
    }

    const promptType = availableTypes[Math.floor(Math.random() * availableTypes.length)];

    // Get context for the prompt
    const book = books.find(b => b.id === selectedElement.book_id);
    let context = {
      bookTitle: book.title,
      elementType: selectedElement.element_type,
      elementName: selectedElement.name
    };

    if (preferences.include_context && selectedElement.description) {
      context.description = selectedElement.description;
    }

    if (preferences.include_previous_answers) {
      // Get previous responses for this element
      const { rows: prevResponses } = await db.query(
        `SELECT r.response_text, p.prompt_text, r.created_at
         FROM responses r
         JOIN prompts p ON r.prompt_id = p.id
         WHERE $1 = ANY(p.element_references)
         AND r.user_id = $2
         ORDER BY r.created_at DESC
         LIMIT 3`,
        [selectedElement.id, userId]
      );
      
      if (prevResponses.length > 0) {
        context.previousAnswers = prevResponses;
      }
    }

    // Generate the AI prompt
    const promptText = await generateAIPrompt({
      bookTitle: context.bookTitle,
      promptType: promptType,
      elementType: context.elementType,
      elementName: context.elementName,
      elementDescription: context.description,
      previousAnswers: context.previousAnswers
    });

    // Save the prompt to database
    const { rows: [prompt] } = await db.query(
      `INSERT INTO prompts (user_id, book_id, prompt_text, prompt_type, prompt_mode, element_references, generated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [userId, selectedElement.book_id, promptText, promptType, 'daily_prompt', [selectedElement.id]]
    );

    return {
      prompt,
      element: selectedElement,
      book,
      context
    };

  } catch (error) {
    console.error('Error selecting prompt for user:', error);
    throw error;
  }
}

/**
 * Get user preferences or create default ones
 */
export async function getUserPreferences(userId) {
  const { rows } = await db.query(
    'SELECT * FROM daily_prompt_preferences WHERE user_id = $1',
    [userId]
  );

  if (rows.length > 0) {
    return rows[0];
  }

  // Create default preferences
  const { rows: [prefs] } = await db.query(
    `INSERT INTO daily_prompt_preferences (user_id, enabled)
     VALUES ($1, false)
     RETURNING *`,
    [userId]
  );

  return prefs;
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(userId, updates) {
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  
  const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(', ');
  
  const { rows: [prefs] } = await db.query(
    `UPDATE daily_prompt_preferences 
     SET ${setClause}
     WHERE user_id = $1
     RETURNING *`,
    [userId, ...values]
  );

  return prefs;
}

/**
 * Log a sent prompt
 */
export async function logSentPrompt(userId, promptId, elementId, emailFormat, resendEmailId) {
  const { rows: [log] } = await db.query(
    `INSERT INTO daily_prompts_sent 
     (user_id, prompt_id, element_id, email_format, resend_email_id, sent_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING *`,
    [userId, promptId, elementId, emailFormat, resendEmailId]
  );

  return log;
}

/**
 * Mark prompt as opened
 */
export async function markPromptOpened(promptLogId) {
  await db.query(
    `UPDATE daily_prompts_sent 
     SET opened_at = NOW()
     WHERE id = $1 AND opened_at IS NULL`,
    [promptLogId]
  );
}

/**
 * Mark prompt as responded
 */
export async function markPromptResponded(promptLogId, responseId) {
  await db.query(
    `UPDATE daily_prompts_sent 
     SET responded_at = NOW(), response_id = $2
     WHERE id = $1`,
    [promptLogId, responseId]
  );
  
  // Reset consecutive skips
  const { rows: [log] } = await db.query(
    'SELECT user_id FROM daily_prompts_sent WHERE id = $1',
    [promptLogId]
  );
  
  if (log) {
    await db.query(
      `UPDATE daily_prompt_preferences 
       SET consecutive_skips = 0
       WHERE user_id = $1`,
      [log.user_id]
    );
  }
}

/**
 * Mark prompt as skipped
 */
export async function markPromptSkipped(promptLogId, skipReason) {
  const { rows: [log] } = await db.query(
    `UPDATE daily_prompts_sent 
     SET skipped = true, skip_reason = $2
     WHERE id = $1
     RETURNING user_id`,
    [promptLogId, skipReason]
  );

  if (log) {
    // Increment consecutive skips
    const { rows: [prefs] } = await db.query(
      `UPDATE daily_prompt_preferences 
       SET consecutive_skips = consecutive_skips + 1
       WHERE user_id = $1
       RETURNING consecutive_skips, pause_after_skips`,
      [log.user_id]
    );

    // Auto-pause if threshold reached
    if (prefs && prefs.consecutive_skips >= prefs.pause_after_skips) {
      await db.query(
        `UPDATE daily_prompt_preferences 
         SET enabled = false
         WHERE user_id = $1`,
        [log.user_id]
      );
      
      return { paused: true };
    }
  }

  return { paused: false };
}

/**
 * Get prompt log by ID
 */
export async function getPromptLog(promptLogId) {
  const { rows } = await db.query(
    `SELECT dps.*, p.prompt_text, p.prompt_type, p.element_references,
            se.name as element_name, se.description as element_description,
            b.title as book_title
     FROM daily_prompts_sent dps
     JOIN prompts p ON dps.prompt_id = p.id
     LEFT JOIN story_elements se ON dps.element_id = se.id
     LEFT JOIN books b ON p.book_id = b.id
     WHERE dps.id = $1`,
    [promptLogId]
  );

  return rows[0] || null;
}

/**
 * Get users who should receive prompts at current time
 */
export async function getUsersForDelivery() {
  const { rows } = await db.query(
    `SELECT user_id, delivery_time, timezone, email_format
     FROM daily_prompt_preferences
     WHERE enabled = true
     AND (
       last_prompt_sent_at IS NULL 
       OR DATE(last_prompt_sent_at AT TIME ZONE timezone) < CURRENT_DATE
     )`
  );

  return rows;
}

/**
 * Update last sent time
 */
export async function updateLastSentTime(userId) {
  await db.query(
    `UPDATE daily_prompt_preferences 
     SET last_prompt_sent_at = NOW()
     WHERE user_id = $1`,
    [userId]
  );
}
