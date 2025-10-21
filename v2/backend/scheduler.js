import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (one directory up from backend/)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import cron from 'node-cron';
import { formatInTimeZone } from 'date-fns-tz';
import db from './db.js';
import {
  getUsersForDelivery,
  getUserPreferences,
  selectPromptForUser,
  logSentPrompt,
  updateLastSentTime
} from './services/dailyPromptsService.js';
import { sendDailyPromptEmail, sendStreakWarningEmail } from './services/emailService.js';

console.log('🕐 Daily Prompts Scheduler starting...');
console.log('🔑 Resend API Key configured:', process.env.RESEND_API_KEY ? 'YES' : 'NO');
console.log('📧 From email:', process.env.RESEND_FROM_EMAIL || 'not set');

/**
 * Main scheduler - runs every hour to check for users who need prompts
 */
cron.schedule('0 * * * *', async () => {
  console.log(`[${new Date().toISOString()}] Running daily prompts check...`);
  
  try {
    // Get all enabled users
    const { rows: users } = await db.query(
      `SELECT dpp.*, u.email, u.name
       FROM daily_prompt_preferences dpp
       JOIN "user" u ON dpp.user_id = u.id
       WHERE dpp.enabled = true`
    );

    console.log(`Found ${users.length} users with daily prompts enabled`);

    for (const user of users) {
      try {
        // Check if it's time to send for this user
        const now = new Date();
        const userTime = formatInTimeZone(now, user.timezone, 'HH:mm');
        const deliveryTime = user.delivery_time.substring(0, 5); // Format: "09:00"

        // Check if already sent today (using UTC for consistency with unique constraint)
        // The unique constraint uses: (sent_at AT TIME ZONE 'UTC')::date
        const { rows: sentToday } = await db.query(
          `SELECT id FROM daily_prompts_sent
           WHERE user_id = $1
           AND (sent_at AT TIME ZONE 'UTC')::date = CURRENT_DATE
           AND is_test = false`,
          [user.user_id]
        );

        if (sentToday.length > 0) {
          console.log(`Already sent prompt to user ${user.user_id} today (UTC: ${new Date().toISOString().split('T')[0]})`);
          continue;
        }

        // Check if current hour matches delivery hour (within same hour window)
        const currentHour = parseInt(userTime.split(':')[0]);
        const deliveryHour = parseInt(deliveryTime.split(':')[0]);

        if (currentHour !== deliveryHour) {
          continue; // Not time yet
        }

        console.log(`Sending daily prompt to user ${user.user_id} (${user.email})`);

        // Select and generate prompt
        const promptData = await selectPromptForUser(user.user_id, user);

        if (!promptData) {
          console.log(`No prompt could be generated for user ${user.user_id}`);
          continue;
        }

        // Create log entry first to get ID
        const promptLog = await logSentPrompt(
          user.user_id,
          promptData.prompt.id,
          promptData.element.id,
          user.email_format,
          null // Will update with Resend email ID
        );

        // Send email
        const resendEmailId = await sendDailyPromptEmail(
          user.email,
          { ...promptData, promptLogId: promptLog.id },
          user
        );

        // Update log with Resend email ID
        await db.query(
          'UPDATE daily_prompts_sent SET resend_email_id = $1 WHERE id = $2',
          [resendEmailId, promptLog.id]
        );

        // Update last sent time
        await updateLastSentTime(user.user_id);

        console.log(`✅ Successfully sent daily prompt to ${user.email}`);

        // Check if we need to send a streak warning
        if (user.send_streak_warning && user.consecutive_skips >= 2) {
          await sendStreakWarningEmail(user.email, {
            consecutiveSkips: user.consecutive_skips,
            pauseThreshold: user.pause_after_skips
          });
          console.log(`⚠️  Sent streak warning to ${user.email}`);
        }

      } catch (error) {
        console.error(`Error processing user ${user.user_id}:`, error);
        // Continue with next user
      }
    }

    console.log('Daily prompts check completed');

  } catch (error) {
    console.error('Error in daily prompts scheduler:', error);
  }
});

// For testing: run immediately on startup (comment out in production)
if (process.env.NODE_ENV === 'development') {
  console.log('🧪 Development mode - running test delivery check in 5 seconds...');
  setTimeout(async () => {
    console.log('Running test delivery...');
    try {
      const { rows: users } = await db.query(
        `SELECT dpp.*, u.email, u.name
         FROM daily_prompt_preferences dpp
         JOIN "user" u ON dpp.user_id = u.id
         WHERE dpp.enabled = true
         LIMIT 1`
      );
      
      if (users.length > 0) {
        console.log(`Test user found: ${users[0].email}`);
      } else {
        console.log('No enabled users found for testing');
      }
    } catch (error) {
      console.error('Test delivery error:', error);
    }
  }, 5000);
}

console.log('✅ Daily Prompts Scheduler is running');
console.log('📅 Cron schedule: Every hour (0 * * * *)');
