import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import db from './db.js';
import { selectPromptForUser } from './services/dailyPromptsService.js';
import { sendDailyPromptEmail } from './services/emailService.js';

async function testEmailSend() {
  try {
    console.log('🧪 Testing email send...\n');

    // Get the user with daily prompts enabled
    const { rows: users } = await db.query(`
      SELECT dpp.*, u.email, u.name
      FROM daily_prompt_preferences dpp
      JOIN "user" u ON dpp.user_id = u.id
      WHERE dpp.enabled = true
      LIMIT 1
    `);

    if (users.length === 0) {
      console.log('❌ No users with daily prompts enabled');
      process.exit(1);
    }

    const user = users[0];
    console.log('✅ Found user:', user.email);
    console.log('   Timezone:', user.timezone);
    console.log('   Delivery time:', user.delivery_time);
    console.log('   Email format:', user.email_format);
    console.log('   Focus story:', user.focus_story_id);

    // Select a prompt
    console.log('\n📝 Selecting prompt...');
    const promptData = await selectPromptForUser(user.user_id, user);

    if (!promptData) {
      console.log('❌ No prompt could be generated');
      process.exit(1);
    }

    console.log('✅ Prompt selected:');
    console.log('   Element:', promptData.element.name, `(${promptData.element.element_type})`);
    console.log('   Book:', promptData.book.title);
    console.log('   Prompt:', promptData.prompt.prompt_text.substring(0, 100) + '...');

    // Create a temporary log entry
    console.log('\n📤 Sending test email...');
    const { rows: [promptLog] } = await db.query(
      `INSERT INTO daily_prompts_sent 
       (user_id, prompt_id, element_id, email_format, sent_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id`,
      [user.user_id, promptData.prompt.id, promptData.element.id, user.email_format]
    );

    // Send the email
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

    console.log('✅ Email sent successfully!');
    console.log('   Resend Email ID:', resendEmailId);
    console.log('   Log ID:', promptLog.id);
    console.log('\n✨ Check your email and your Resend dashboard!');
    console.log('   Resend Dashboard: https://resend.com/emails');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

testEmailSend();
