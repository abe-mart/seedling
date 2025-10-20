import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (two directories up from services/)
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

import { Resend } from 'resend';
import jwt from 'jsonwebtoken';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'StorySeed <hello@storyseed.martinapps.org>';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5176';

/**
 * Generate magic link token for prompt access
 */
export function generateMagicLinkToken(promptLogId, userId) {
  return jwt.sign(
    { promptLogId, userId },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Verify magic link token
 */
export function verifyMagicLinkToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Send daily writing prompt email
 */
export async function sendDailyPromptEmail(userEmail, promptData, preferences) {
  const { prompt, element, book, promptLogId } = promptData;
  
  // Generate magic link
  const token = generateMagicLinkToken(promptLogId, prompt.user_id);
  const writeUrl = `${BASE_URL}/write/${promptLogId}?token=${token}`;
  const skipUrl = `${BASE_URL}/api/daily-prompts/skip/${promptLogId}?token=${token}`;
  
  // Get email template based on format
  const { subject, html, text } = getEmailTemplate(
    preferences.email_format,
    {
      promptText: prompt.prompt_text,
      elementName: element.name,
      elementType: element.element_type,
      bookTitle: book.title,
      writeUrl,
      skipUrl
    }
  );

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject,
      html,
      text,
      tags: [
        { name: 'category', value: 'daily_prompt' },
        { name: 'format', value: preferences.email_format }
      ]
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return data.id; // Resend email ID for tracking
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Get email template based on format preference
 */
function getEmailTemplate(format, data) {
  const { promptText, elementName, elementType, bookTitle, writeUrl, skipUrl } = data;
  
  switch (format) {
    case 'minimal':
      return {
        subject: `✍️ Your daily writing prompt`,
        html: getMinimalHTML(data),
        text: getMinimalText(data)
      };
    
    case 'detailed':
      return {
        subject: `✍️ Daily prompt: ${elementName} (${bookTitle})`,
        html: getDetailedHTML(data),
        text: getDetailedText(data)
      };
    
    case 'inspirational':
      return {
        subject: `🌱 Time to grow your story: ${elementName}`,
        html: getInspirationalHTML(data),
        text: getInspirationalText(data)
      };
    
    default:
      return {
        subject: `✍️ Your daily writing prompt`,
        html: getMinimalHTML(data),
        text: getMinimalText(data)
      };
  }
}

/**
 * Minimal email template (HTML)
 */
function getMinimalHTML({ promptText, writeUrl, skipUrl }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .prompt { background: linear-gradient(135deg, #10b981 0%, #84cc16 100%); color: white; padding: 24px; border-radius: 12px; margin: 20px 0; }
    .prompt-text { font-size: 18px; line-height: 1.6; margin: 0; }
    .actions { margin: 24px 0; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 8px 8px 8px 0; font-weight: 600; }
    .button-secondary { background: transparent; border: 2px solid #d1d5db; color: #6b7280; }
    .footer { color: #6b7280; font-size: 14px; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="prompt">
    <p class="prompt-text">${promptText}</p>
  </div>
  
  <div class="actions">
    <a href="${writeUrl}" class="button">Write Now</a>
    <a href="${skipUrl}" class="button button-secondary">Skip Today</a>
  </div>
  
  <div class="footer">
    <p>Keep your streak alive! 🔥<br>
    <a href="${BASE_URL}/settings/daily-prompts" style="color: #10b981; text-decoration: none;">Manage your preferences</a> • 
    <a href="${BASE_URL}/settings/daily-prompts?unsubscribe=true" style="color: #9ca3af; text-decoration: none;">Unsubscribe</a></p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Minimal email template (Text)
 */
function getMinimalText({ promptText, writeUrl, skipUrl }) {
  return `
Your Daily Writing Prompt
========================

${promptText}

Write Now: ${writeUrl}
Skip Today: ${skipUrl}

Keep your streak alive! 🔥
Manage preferences: ${BASE_URL}/settings/daily-prompts
Unsubscribe: ${BASE_URL}/settings/daily-prompts?unsubscribe=true
  `.trim();
}

/**
 * Detailed email template (HTML)
 */
function getDetailedHTML({ promptText, elementName, elementType, bookTitle, writeUrl, skipUrl }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #84cc16 100%); color: white; padding: 32px 24px; border-radius: 12px 12px 0 0; }
    .header h1 { margin: 0 0 8px 0; font-size: 24px; }
    .header p { margin: 0; opacity: 0.9; font-size: 14px; }
    .content { background: #f9fafb; padding: 24px; border-radius: 0 0 12px 12px; }
    .context { background: white; padding: 16px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981; }
    .context-label { font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600; margin-bottom: 4px; }
    .context-value { font-size: 16px; color: #111827; font-weight: 500; }
    .prompt { background: white; padding: 24px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .prompt-text { font-size: 18px; line-height: 1.6; margin: 0; color: #111827; }
    .actions { margin: 24px 0; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 8px 8px 8px 0; font-weight: 600; }
    .button-secondary { background: transparent; border: 2px solid #d1d5db; color: #6b7280; }
    .footer { color: #6b7280; font-size: 14px; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="header">
    <h1>✍️ Your Daily Writing Prompt</h1>
    <p>Take a few minutes to develop your story</p>
  </div>
  
  <div class="content">
    <div class="context">
      <div class="context-label">Story</div>
      <div class="context-value">${bookTitle}</div>
    </div>
    
    <div class="context">
      <div class="context-label">${elementType}</div>
      <div class="context-value">${elementName}</div>
    </div>
    
    <div class="prompt">
      <p class="prompt-text">${promptText}</p>
    </div>
    
    <div class="actions">
      <a href="${writeUrl}" class="button">Write Now</a>
      <a href="${skipUrl}" class="button button-secondary">Skip Today</a>
    </div>
  </div>
  
  <div class="footer">
    <p>Keep your streak alive! 🔥<br>
    <a href="${BASE_URL}/settings/daily-prompts" style="color: #10b981; text-decoration: none;">Manage your preferences</a> • 
    <a href="${BASE_URL}/settings/daily-prompts?unsubscribe=true" style="color: #9ca3af; text-decoration: none;">Unsubscribe</a></p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Detailed email template (Text)
 */
function getDetailedText({ promptText, elementName, elementType, bookTitle, writeUrl, skipUrl }) {
  return `
✍️ Your Daily Writing Prompt
============================

Story: ${bookTitle}
${elementType}: ${elementName}

${promptText}

Write Now: ${writeUrl}
Skip Today: ${skipUrl}

Keep your streak alive! 🔥
Manage preferences: ${BASE_URL}/settings/daily-prompts
Unsubscribe: ${BASE_URL}/settings/daily-prompts?unsubscribe=true
  `.trim();
}

/**
 * Inspirational email template (HTML)
 */
function getInspirationalHTML({ promptText, elementName, elementType, bookTitle, writeUrl, skipUrl }) {
  const inspirationalQuotes = [
    "Every great story starts with a single word.",
    "Your story matters. Write it.",
    "Small steps lead to finished manuscripts.",
    "The best time to write is now.",
    "Your characters are waiting for you."
  ];
  const quote = inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)];
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .hero { background: linear-gradient(135deg, #10b981 0%, #84cc16 100%); color: white; padding: 48px 24px; border-radius: 12px; text-align: center; margin-bottom: 24px; }
    .hero h1 { margin: 0 0 16px 0; font-size: 28px; }
    .quote { font-size: 18px; font-style: italic; opacity: 0.9; margin: 0; }
    .seedling { font-size: 48px; margin-bottom: 16px; }
    .context { text-align: center; margin: 24px 0; }
    .context-label { font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600; }
    .context-value { font-size: 18px; color: #111827; font-weight: 600; margin: 4px 0; }
    .prompt { background: white; padding: 32px; border-radius: 12px; margin: 24px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 2px solid #e5e7eb; }
    .prompt-text { font-size: 20px; line-height: 1.6; margin: 0; color: #111827; text-align: center; }
    .actions { text-align: center; margin: 32px 0; }
    .button { display: inline-block; background: #10b981; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; margin: 8px; font-weight: 600; font-size: 16px; }
    .button-secondary { background: transparent; border: 2px solid #d1d5db; color: #6b7280; }
    .footer { color: #6b7280; font-size: 14px; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; }
  </style>
</head>
<body>
  <div class="hero">
    <div class="seedling">🌱</div>
    <h1>Time to Grow Your Story</h1>
    <p class="quote">"${quote}"</p>
  </div>
  
  <div class="context">
    <div class="context-label">Today's Focus</div>
    <div class="context-value">${elementName}</div>
    <div class="context-label" style="margin-top: 8px;">in ${bookTitle}</div>
  </div>
  
  <div class="prompt">
    <p class="prompt-text">${promptText}</p>
  </div>
  
  <div class="actions">
    <a href="${writeUrl}" class="button">✍️ Start Writing</a><br>
    <a href="${skipUrl}" class="button button-secondary">Skip Today</a>
  </div>
  
  <div class="footer">
    <p>Keep nurturing your story, one prompt at a time 🔥<br>
    <a href="${BASE_URL}/settings/daily-prompts" style="color: #10b981; text-decoration: none;">Manage your preferences</a> • 
    <a href="${BASE_URL}/settings/daily-prompts?unsubscribe=true" style="color: #9ca3af; text-decoration: none;">Unsubscribe</a></p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Inspirational email template (Text)
 */
function getInspirationalText({ promptText, elementName, elementType, bookTitle, writeUrl, skipUrl }) {
  const inspirationalQuotes = [
    "Every great story starts with a single word.",
    "Your story matters. Write it.",
    "Small steps lead to finished manuscripts.",
    "The best time to write is now.",
    "Your characters are waiting for you."
  ];
  const quote = inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)];
  
  return `
🌱 Time to Grow Your Story
==========================

"${quote}"

Today's Focus: ${elementName}
Story: ${bookTitle}

${promptText}

✍️ Start Writing: ${writeUrl}
Skip Today: ${skipUrl}

Keep nurturing your story, one prompt at a time 🔥
Manage preferences: ${BASE_URL}/settings/daily-prompts
Unsubscribe: ${BASE_URL}/settings/daily-prompts?unsubscribe=true
  `.trim();
}

/**
 * Send streak warning email
 */
export async function sendStreakWarningEmail(userEmail, userData) {
  const { consecutiveSkips, pauseThreshold } = userData;
  
  const subject = `⚠️ Don't lose your StorySeed streak!`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .warning { background: #fef3c7; border: 2px solid #f59e0b; padding: 24px; border-radius: 12px; text-align: center; }
    .warning-icon { font-size: 48px; margin-bottom: 16px; }
    h1 { color: #92400e; margin: 0 0 16px 0; }
    p { margin: 8px 0; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0; font-weight: 600; }
  </style>
</head>
<body>
  <div class="warning">
    <div class="warning-icon">⚠️</div>
    <h1>Don't Lose Your Streak!</h1>
    <p>You've skipped ${consecutiveSkips} prompts in a row.</p>
    <p>After ${pauseThreshold} skips, your daily prompts will be paused.</p>
    <a href="${BASE_URL}/prompt" class="button">Write Something Today</a>
  </div>
</body>
</html>
  `.trim();

  const text = `
⚠️ Don't Lose Your Streak!

You've skipped ${consecutiveSkips} prompts in a row.
After ${pauseThreshold} skips, your daily prompts will be paused.

Write something today: ${BASE_URL}/prompt
  `.trim();

  await resend.emails.send({
    from: FROM_EMAIL,
    to: userEmail,
    subject,
    html,
    text,
    tags: [{ name: 'category', value: 'streak_warning' }]
  });
}
