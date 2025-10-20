#!/usr/bin/env node
/**
 * Direct test of the email sending functionality
 * Bypasses the API endpoint and tests the core logic
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { pool } from './db.js';
import { getUserPreferences, selectPromptForUser } from './services/dailyPromptsService.js';
import { sendDailyPromptEmail } from './services/emailService.js';

async function testEmailSendingFlow() {
  console.log('🧪 Testing Email Sending Flow (Direct)\n');
  
  try {
    // Get a test user
    console.log('1️⃣ Finding test user...');
    const { rows: users } = await pool.query(
      'SELECT id, email FROM "user" WHERE email = $1',
      ['abe.mart@gmail.com']
    );
    
    if (users.length === 0) {
      console.error('❌ No test user found. Please provide a valid user email.');
      process.exit(1);
    }
    
    const user = users[0];
    console.log(`   ✅ Found user: ${user.email} (${user.id})\n`);
    
    // Get preferences
    console.log('2️⃣ Loading user preferences...');
    const preferences = await getUserPreferences(user.id);
    
    if (!preferences.enabled) {
      console.error('❌ Daily prompts not enabled for this user');
      process.exit(1);
    }
    
    console.log(`   ✅ Preferences loaded`);
    console.log(`      - Email format: ${preferences.email_format}`);
    console.log(`      - Delivery time: ${preferences.delivery_time}`);
    console.log(`      - Timezone: ${preferences.timezone}\n`);
    
    // Get user's books
    console.log('3️⃣ Checking for books...');
    const { rows: books } = await pool.query(
      'SELECT * FROM books WHERE user_id = $1 LIMIT 1',
      [user.id]
    );
    
    if (books.length === 0) {
      console.error('❌ No books found for this user');
      process.exit(1);
    }
    
    console.log(`   ✅ Found book: "${books[0].title}"\n`);
    
    // Select a prompt
    console.log('4️⃣ Generating prompt...');
    const promptData = await selectPromptForUser(user.id, preferences);
    
    if (!promptData) {
      console.error('❌ Could not generate prompt');
      process.exit(1);
    }
    
    console.log(`   ✅ Prompt generated`);
    console.log(`      - Element: ${promptData.element.name} (${promptData.element.element_type})`);
    console.log(`      - Book: ${promptData.book.title}`);
    console.log(`      - Prompt: ${promptData.prompt.prompt_text.substring(0, 100)}...\n`);
    
    // Create log entry
    console.log('5️⃣ Creating log entry...');
    const { rows: [promptLog] } = await pool.query(
      `INSERT INTO daily_prompts_sent (user_id, prompt_id, element_id, email_format, sent_at, is_test)
       VALUES ($1, $2, $3, $4, NOW(), true)
       RETURNING id`,
      [user.id, promptData.prompt.id, promptData.element.id, preferences.email_format]
    );
    
    console.log(`   ✅ Log entry created (ID: ${promptLog.id})\n`);
    
    // Send email
    console.log('6️⃣ Sending email via Resend...');
    const resendEmailId = await sendDailyPromptEmail(
      user.email,
      { ...promptData, promptLogId: promptLog.id },
      preferences
    );
    
    console.log(`   ✅ Email sent!`);
    console.log(`      - Resend ID: ${resendEmailId}\n`);
    
    // Update log with Resend ID
    console.log('7️⃣ Updating log with Resend ID...');
    await pool.query(
      'UPDATE daily_prompts_sent SET resend_email_id = $1 WHERE id = $2',
      [resendEmailId, promptLog.id]
    );
    
    console.log(`   ✅ Log updated\n`);
    
    console.log('✅ SUCCESS! Test email sent successfully!');
    console.log(`\n📧 Check your email: ${user.email}`);
    console.log('💡 Check spam folder if not in inbox');
    console.log(`🔗 Resend Dashboard: https://resend.com/emails/${resendEmailId}`);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testEmailSendingFlow();
