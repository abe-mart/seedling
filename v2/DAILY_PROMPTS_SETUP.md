# Daily Writing Prompts - Setup & Testing Guide

## ⚙️ Configuration Required

### Step 1: Add Resend API Key

Edit `/home/pi/seedling/v2/.env` and replace the placeholder with your actual Resend API key:

```bash
# Current (needs updating):
RESEND_API_KEY=your_resend_api_key_here

# Replace with your actual key:
RESEND_API_KEY=re_abc123xyz...
```

Your Resend API key can be found at: https://resend.com/api-keys

### Step 2: Restart Services

After adding the API key, restart the services:

```bash
cd /home/pi/seedling/v2
pm2 restart seedling-v2 seedling-scheduler
```

## ✅ Verification

Check that both services are running:

```bash
pm2 list
```

You should see:
- `seedling-v2` - status: online
- `seedling-scheduler` - status: online

View scheduler logs:

```bash
pm2 logs seedling-scheduler --lines 30
```

You should see:
```
🕐 Daily Prompts Scheduler starting...
✅ Daily Prompts Scheduler is running
📅 Cron schedule: Every hour (0 * * * *)
```

## 🧪 Testing the Feature

### Test 1: Settings Page

1. Visit your StorySeed app (http://localhost:5176 or your domain)
2. Log in with your account
3. Navigate to `/settings` or add a "Settings" link to your navigation
4. You should see the Daily Writing Prompts settings page

**Verify**:
- Toggle switch to enable daily prompts
- Time picker for delivery time
- Timezone dropdown
- Email format selection (minimal/detailed/inspirational)
- Story focus dropdown (populated with your stories)
- Prompt type checkboxes
- Smart features toggles
- Save button

### Test 2: Enable Daily Prompts

1. On the `/settings` page:
   - Toggle "Enable Daily Prompts" to ON
   - Set delivery time to 1-2 hours from now (or current time for immediate testing)
   - Select your timezone
   - Choose email format: "Detailed" (easiest to test)
   - Ensure you have at least one story and one story element created
   - Click "Save Preferences"

2. Check database to confirm settings saved:

```bash
psql -U seedling_user -d seedling -c "SELECT * FROM daily_prompt_preferences WHERE enabled = true;"
```

### Test 3: Manual Test Send (Optional)

If you want to test immediately without waiting for the cron schedule, you can trigger a manual send by temporarily modifying the cron schedule:

1. Edit `v2/backend/scheduler.js` line 13:

```javascript
// Change from hourly to every minute for testing
cron.schedule('* * * * *', async () => {  // Runs every minute
```

2. Restart scheduler:

```bash
pm2 restart seedling-scheduler
```

3. Watch the logs:

```bash
pm2 logs seedling-scheduler --lines 50
```

Within 1 minute, you should see:
```
Running daily prompts check...
Found 1 users with daily prompts enabled
Sending daily prompt to user xxx (your@email.com)
✅ Successfully sent daily prompt to your@email.com
```

4. **IMPORTANT**: Change the cron schedule back to hourly after testing:

```javascript
// Change back to hourly
cron.schedule('0 * * * *', async () => {
```

5. Restart again:

```bash
pm2 restart seedling-scheduler
```

### Test 4: Check Your Email

1. Check your inbox for an email from "StorySeed <hello@storyseed.martinapps.org>"
2. The email should contain:
   - Your story name
   - Element name and type
   - AI-generated writing prompt
   - "Write Now" button
   - "Skip Today" button

### Test 5: Magic Link Authentication

1. Click the "Write Now" button in the email
2. You should be taken to `/write/:logId?token=...`
3. The page should display:
   - Story context card
   - Your writing prompt
   - Large textarea for response
   - Word count
   - "Submit Response" button
   - "Skip Today" button

**Verify**:
- No login required (magic link authentication)
- Beautiful gradient design
- Responsive layout

### Test 6: Submit a Response

1. Write at least 10 words in the textarea
2. Click "Submit Response"
3. You should see:
   - Success toast notification
   - Message: "Response saved! Great work! 🎉"
   - Second message: "You can close this page now or keep writing"

### Test 7: Verify Response Saved

Check the database:

```bash
psql -U seedling_user -d seedling -c "
SELECT dps.sent_at, dps.opened_at, dps.responded_at, dps.skipped, r.response_text, r.word_count
FROM daily_prompts_sent dps
LEFT JOIN responses r ON dps.response_id = r.id
ORDER BY dps.sent_at DESC
LIMIT 1;
"
```

You should see:
- `sent_at` - timestamp when email was sent
- `opened_at` - timestamp when you clicked "Write Now"
- `responded_at` - timestamp when you submitted
- `skipped` - false
- `response_text` - your response
- `word_count` - number of words

### Test 8: Test Skip Functionality

1. Request another email (wait for next cron run or use the manual test method)
2. Click "Skip Today" button in email OR on the write page
3. Verify skip was logged:

```bash
psql -U seedling_user -d seedling -c "
SELECT sent_at, skipped, skip_reason 
FROM daily_prompts_sent 
WHERE skipped = true 
ORDER BY sent_at DESC 
LIMIT 1;
"
```

### Test 9: Check Streak Warnings

1. Skip 2 prompts in a row (consecutive days or manual testing)
2. On the 3rd skip attempt, you should receive a streak warning email
3. Subject: "⚠️ Don't lose your StorySeed streak!"
4. Content explains you've skipped X times and will be paused after Y skips

### Test 10: Test Auto-Pause

1. Skip 3 prompts in a row (or whatever your `pause_after_skips` is set to)
2. Daily prompts should automatically pause
3. Verify in database:

```bash
psql -U seedling_user -d seedling -c "
SELECT enabled, consecutive_skips 
FROM daily_prompt_preferences 
WHERE user_id = 'your-user-id';
"
```

Should show `enabled = false` and `consecutive_skips = 3` (or your threshold)

## 🔍 Troubleshooting

### No Email Received

1. **Check scheduler logs**:
   ```bash
   pm2 logs seedling-scheduler --lines 50
   ```
   Look for errors or "Sending daily prompt to..." messages

2. **Verify Resend API key is correct**:
   ```bash
   grep RESEND_API_KEY /home/pi/seedling/v2/.env
   ```

3. **Test Resend API directly**:
   ```bash
   curl -X POST "https://api.resend.com/emails" \
     -H "Authorization: Bearer YOUR_RESEND_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "from": "StorySeed <hello@storyseed.martinapps.org>",
       "to": "your@email.com",
       "subject": "Test Email",
       "html": "<p>This is a test</p>"
     }'
   ```

4. **Check timezone matching**:
   - Scheduler runs every hour (on the hour)
   - It checks if your configured delivery time matches the current hour
   - Example: If set to 09:00, it will send between 09:00-09:59 in your timezone

5. **Verify you have content**:
   - At least one story (book)
   - At least one story element
   - User has an email address
   - Daily prompts are enabled

### Magic Link Not Working

1. **Check JWT_SECRET is set**:
   ```bash
   grep JWT_SECRET /home/pi/seedling/v2/.env
   ```

2. **Verify token hasn't expired** (24-hour expiry)

3. **Check server logs**:
   ```bash
   pm2 logs seedling-v2 --lines 50
   ```

4. **Test token verification endpoint**:
   Visit the `/write/:logId?token=...` URL from the email and check browser console for errors

### Scheduler Not Running

1. **Check PM2 status**:
   ```bash
   pm2 list
   ```
   `seedling-scheduler` should show "online"

2. **Check for errors**:
   ```bash
   pm2 logs seedling-scheduler --err --lines 50
   ```

3. **Restart scheduler**:
   ```bash
   pm2 restart seedling-scheduler
   ```

4. **Verify cron schedule**:
   Should be `0 * * * *` (every hour) in `backend/scheduler.js`

## 📊 Monitoring

### View All Daily Prompt Activity

```sql
SELECT 
  u.email,
  dps.sent_at,
  dps.opened_at,
  dps.responded_at,
  dps.skipped,
  p.prompt_type,
  se.name as element_name,
  b.title as book_title
FROM daily_prompts_sent dps
JOIN "user" u ON dps.user_id = u.id
JOIN prompts p ON dps.prompt_id = p.id
LEFT JOIN story_elements se ON dps.element_id = se.id
LEFT JOIN books b ON p.book_id = b.id
ORDER BY dps.sent_at DESC
LIMIT 20;
```

### Check Email Delivery Success Rate

```sql
SELECT 
  COUNT(*) as total_sent,
  COUNT(opened_at) as opened,
  COUNT(responded_at) as responded,
  COUNT(CASE WHEN skipped THEN 1 END) as skipped,
  ROUND(COUNT(responded_at)::numeric / COUNT(*)::numeric * 100, 2) as response_rate
FROM daily_prompts_sent;
```

### View User Preferences

```sql
SELECT 
  u.email,
  dpp.enabled,
  dpp.delivery_time,
  dpp.timezone,
  dpp.email_format,
  dpp.consecutive_skips,
  dpp.last_prompt_sent_at
FROM daily_prompt_preferences dpp
JOIN "user" u ON dpp.user_id = u.id;
```

## 🎯 Next Steps

Once testing is complete:

1. **Update BASE_URL in .env** to your production domain
2. **Consider adding navigation link** to `/settings` in your app
3. **Monitor logs** for the first few days
4. **Test all three email formats** to see which you prefer
5. **Consider adding weekly summary emails** (future enhancement)
6. **Add analytics** to track engagement rates

## 🚀 Production Deployment

When ready for production:

1. Ensure `.env` has production values:
   ```env
   BASE_URL=https://your-production-domain.com
   FRONTEND_URL=https://your-production-domain.com
   NODE_ENV=production
   ```

2. Remove development testing code in `scheduler.js` (lines 120-135)

3. Build and deploy:
   ```bash
   npm run build
   pm2 restart all
   ```

4. Set up monitoring/alerting for:
   - Scheduler process health
   - Email delivery failures
   - Database connection issues

---

**Need Help?**
- Check `/home/pi/seedling/v2/DAILY_PROMPTS_IMPLEMENTATION.md` for implementation details
- View logs: `pm2 logs seedling-scheduler`
- Check database directly with psql
- Test Resend API at https://resend.com/docs
