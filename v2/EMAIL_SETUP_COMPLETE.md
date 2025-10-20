# Email Setup Complete ✅

## Issues Fixed

### 1. **URLs Pointing to Localhost** ✅
- **Problem**: Email links were using `http://localhost:5176` instead of production URL
- **Solution**: Updated `.env` file to use Cloudflare tunnel URL
  - `BASE_URL=https://storyseed.martinapps.org`
  - `FRONTEND_URL=https://storyseed.martinapps.org`

### 2. **Test Email Button Added** ✅
- **Location**: Daily Prompt Settings page
- **Features**:
  - Send yourself a test email to verify setup
  - Shows helpful tip about checking spam folder
  - Only visible when daily prompts are enabled
  - Beautiful blue gradient design to stand out

## Changes Made

### Backend (`backend/server.js`)
- Added new endpoint: `POST /api/daily-prompts/send-test-email`
- Endpoint is protected (requires authentication)
- Generates a real prompt and sends it via email
- Returns success message with Resend email ID

### Frontend (`src/components/DailyPromptSettings.tsx`)
- Added "Send Test" button with loading state
- Added helpful tip about checking spam folder
- Shows toast notification with reminder to check spam
- Button only appears when daily prompts are enabled

### Database
- Added `is_test` column to `daily_prompts_sent` table
- Allows tracking which emails were test emails vs real daily prompts

### Environment Variables
- Updated `BASE_URL` to production URL
- Restarted both backend server and scheduler with new config

## Testing

To test the new feature:

1. Go to https://storyseed.martinapps.org/settings
2. Make sure "Enable Daily Prompts" is turned ON
3. Click the blue "Send Test" button in the new section
4. Check your email inbox (and spam folder!)
5. The email should now have working links pointing to the production URL

## Email Deliverability

**Important**: If emails go to spam:

1. **Mark as "Not Spam"** in your email client
2. **Add to contacts**: Add `hello@storyseed.martinapps.org` to your contacts
3. **Verify domain**: Check Resend dashboard to ensure `storyseed.martinapps.org` is verified
4. **SPF/DKIM**: Resend handles this automatically for verified domains

## Production URLs

All email links now point to:
- Write prompt: `https://storyseed.martinapps.org/write/{logId}?token={token}`
- Skip prompt: `https://storyseed.martinapps.org/api/daily-prompts/skip/{logId}?token={token}`
- Settings: `https://storyseed.martinapps.org/settings`

## Next Steps

1. Test the "Send Test" button
2. Check if email arrives in spam or inbox
3. If in spam, mark as "Not Spam" and add sender to contacts
4. Wait for tomorrow's automatic email at 5:05 PM Denver time
5. Verify domain is verified in Resend dashboard: https://resend.com/domains

## Files Modified

- `.env` - Updated BASE_URL and FRONTEND_URL
- `backend/server.js` - Added test email endpoint
- `src/components/DailyPromptSettings.tsx` - Added test button UI
- `database` - Added is_test column to daily_prompts_sent table

---

**Status**: ✅ Ready for testing!
**Date**: October 19, 2025
