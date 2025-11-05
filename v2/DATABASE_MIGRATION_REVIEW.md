# Database Migration Review & Updates

## Summary

I've reviewed all database migration files and found several inconsistencies between the schema definitions and the code that uses them. All issues have been fixed.

## Issues Found & Fixed

### 1. Missing `is_test` Column in `daily_prompts_sent`

**Problem:** The code inserts test emails with an `is_test` flag, but this column wasn't defined in the migration.

**Files affected:**
- `backend/server.js:537`
- `backend/test-email-flow.js:83`

**Fix:** Added `is_test BOOLEAN DEFAULT false` to the `daily_prompts_sent` table definition.

### 2. Missing `focus_element_ids` Column in `daily_prompt_preferences`

**Problem:** The daily prompts service uses `focus_element_ids` to allow users to focus on specific story elements, but this column wasn't in the migration.

**Files affected:**
- `backend/services/dailyPromptsService.js:45-50`

**Fix:** Added `focus_element_ids UUID[] DEFAULT '{}'` to the `daily_prompt_preferences` table definition.

### 3. Unique Index Not Excluding Test Emails

**Problem:** The unique constraint on `daily_prompts_sent` prevented multiple test emails per day, which broke the test email functionality.

**Fix:** Updated the unique index to: 
```sql
CREATE UNIQUE INDEX idx_daily_prompts_sent_unique_user_day 
ON daily_prompts_sent(user_id, (DATE(sent_at))) 
WHERE is_test = false;
```

### 4. Missing Daily Prompts Tables in Supabase Migration

**Problem:** If you ever want to deploy to Supabase, the daily prompts functionality wouldn't work because those tables weren't in the Supabase migration files.

**Fix:** Created a new Supabase migration file: `supabase/migrations/20251103000000_add_daily_prompts.sql`

## Updated Files

### 1. `/database/daily_prompts_migration.sql`
- ✅ Added `focus_element_ids` column to `daily_prompt_preferences`
- ✅ Added `is_test` column to `daily_prompts_sent`
- ✅ Updated unique index to exclude test emails

### 2. `/database/daily_prompts_migration_update.sql` (NEW)
A safe migration script that can be run on existing databases to add the missing columns without breaking anything. It:
- Checks if columns exist before adding them
- Updates the unique index to exclude test emails
- Provides helpful status messages

**Usage:**
```bash
psql -U seedling_user -d seedling -f database/daily_prompts_migration_update.sql
```

### 3. `/supabase/migrations/20251103000000_add_daily_prompts.sql` (NEW)
Complete daily prompts feature for Supabase deployments, including:
- Both daily prompts tables
- All indexes with correct constraints
- RLS policies for secure access
- Proper foreign key relationships using UUIDs (Supabase auth)
- Automatic triggers for `updated_at` timestamps

## Migration Path

### ⭐ Recommended: For Fresh PostgreSQL Installation (Pi/Local)

**Use the combined migration file** (easiest method):
```bash
# Create database and user first
sudo -u postgres psql << EOF
CREATE DATABASE seedling;
CREATE USER seedling_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE seedling TO seedling_user;
EOF

# Run complete migration (one file does everything!)
psql -U postgres -d seedling -f database/complete_migration.sql
```

### For Existing PostgreSQL Database (Pi/Local)

If you've already run the daily prompts migration but are missing columns:
```bash
psql -U seedling_user -d seedling -f database/daily_prompts_migration_update.sql
```

### Legacy Method (For Reference)

The old two-step process (now replaced by complete_migration.sql):
```bash
# Run in order:
psql -U postgres -d seedling -f database/pi_migration.sql
psql -U seedling_user -d seedling -f database/daily_prompts_migration.sql
```

### For Supabase (Future)
The migrations are already in the correct directory structure. Supabase will automatically detect and run them in order based on timestamps.

## Critical: Better Auth Uses camelCase!

**IMPORTANT:** Better Auth automatically creates tables with **camelCase column names**, not snake_case. The migration files have been updated to match this.

### Better Auth Tables (camelCase):
- `user`: `emailVerified`, `createdAt`, `updatedAt`
- `session`: `expiresAt`, `userId`, `ipAddress`, `userAgent`, `createdAt`, `updatedAt`
- `account`: `accountId`, `providerId`, `userId`, `accessToken`, `refreshToken`, `idToken`, `accessTokenExpiresAt`, `refreshTokenExpiresAt`, `createdAt`, `updatedAt`
- `verification`: `expiresAt`, `createdAt`, `updatedAt`

### Application Tables (snake_case):
- All other tables use snake_case as normal PostgreSQL convention

### Profiles Table Structure
The `profiles` table uses `user_id` as the PRIMARY KEY (not a separate `id` column). This matches Better Auth's pattern where `user_id` directly references the Better Auth `user.id`.

## Schema Verification

All migration files now match the actual database usage in the code. Key tables:

### Core Tables (pi_migration.sql)
- ✅ `user`, `session`, `account`, `verification` (Better Auth)
- ✅ `profiles`, `series`, `books`, `story_elements`
- ✅ `prompts`, `responses`, `user_settings`

### Daily Prompts Tables (daily_prompts_migration.sql)
- ✅ `daily_prompt_preferences` (with `focus_element_ids`)
- ✅ `daily_prompts_sent` (with `is_test`)

### Indexes
- ✅ All performance indexes in place
- ✅ Unique constraint properly excludes test emails
- ✅ Foreign key indexes for joins

### Triggers
- ✅ Auto-update `updated_at` timestamps
- ✅ Proper CASCADE deletes for data integrity

## Notes

### User ID Types
The different user ID types across migrations are **intentional and correct**:
- **Pi/Local PostgreSQL:** Uses `TEXT` for user_id (Better Auth style)
- **Supabase:** Uses `UUID` for user_id (Supabase auth style)

This is not a bug - each authentication system uses a different ID format.

### Test Emails
The `is_test` column allows unlimited test emails per day while still enforcing the "one real daily prompt per day" rule. This is important for:
- Testing email templates
- Debugging delivery issues
- User verification of setup

## Recommendations

1. **Run the update script** on your production database to add missing columns:
   ```bash
   psql -U seedling_user -d seedling -f database/daily_prompts_migration_update.sql
   ```

2. **Keep migrations in sync** - When adding new features that need database changes, update all relevant migration files (both Pi and Supabase versions).

3. **Test migrations** - Always test migration scripts on a development database before running on production.

4. **Document schema changes** - Update this file when making future schema changes.

## Current Status

✅ All migration files are now up to date and consistent with the codebase.
✅ Both PostgreSQL (Better Auth) and Supabase (Supabase Auth) versions are maintained.
✅ Safe update script created for existing installations.
✅ All code references to database columns now have matching schema definitions.
