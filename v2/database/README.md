# Database Setup Guide

This directory contains migration files and utilities for setting up the StorySeed PostgreSQL database.

## Quick Start (Fresh Installation)

For a brand new system, you only need **ONE** file:

```bash
# 1. Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE seedling;
CREATE USER seedling_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE seedling TO seedling_user;
\c seedling
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO seedling_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO seedling_user;
EOF

# 2. Run the complete migration
psql -U postgres -d seedling -f database/complete_migration.sql
```

That's it! Your database is ready.

## Files Overview

### Primary Migration File

- **`complete_migration.sql`** ⭐ **USE THIS FOR NEW INSTALLATIONS**
  - Single comprehensive migration file
  - Includes everything: Better Auth tables, application tables, daily prompts
  - Creates all indexes, triggers, and permissions
  - Best for deploying to new systems

### Legacy Migration Files (For Reference)

These are kept for historical reference but are **not needed** for new installations:

- `pi_migration.sql` - Original core schema (now included in complete_migration.sql)
- `daily_prompts_migration.sql` - Daily prompts feature (now included in complete_migration.sql)

### Update/Patch Files

- **`daily_prompts_migration_update.sql`** - Adds missing columns to existing databases
  - Use this if you already have the daily prompts tables but need to add:
    - `focus_element_ids` column
    - `is_test` column
    - Updated unique index

### Utility Scripts

- **`quick_schema_check.sh`** - Quick overview of database structure (no password needed)
- **`verify_schema.sh`** - Comprehensive schema verification (requires password)

## Schema Structure

### Better Auth Tables (camelCase) 🔐

Better Auth requires camelCase column names:

- `user` - id, email, emailVerified, name, createdAt, updatedAt
- `session` - id, expiresAt, token, userId, ipAddress, userAgent, createdAt, updatedAt
- `account` - id, accountId, providerId, userId, accessToken, refreshToken, etc.
- `verification` - id, identifier, value, expiresAt, createdAt, updatedAt

### Application Tables (snake_case) 📚

Standard PostgreSQL naming:

- `profiles` - Extended user information (user_id is PRIMARY KEY)
- `series` - Book series
- `books` - Individual writing projects
- `story_elements` - Characters, locations, plot points, items, themes
- `prompts` - AI-generated writing prompts
- `responses` - User responses to prompts
- `user_settings` - User preferences

### Daily Prompts Tables 📧

- `daily_prompt_preferences` - Email delivery settings and content preferences
- `daily_prompts_sent` - Engagement tracking for sent prompts

## Updating an Existing Database

If you already have a database and need to add missing columns:

```bash
psql -U seedling_user -d seedling -f database/daily_prompts_migration_update.sql
```

## Verification

After setup, verify everything is correct:

```bash
# Quick check (no password)
./database/quick_schema_check.sh

# Comprehensive check (requires password)
./database/verify_schema.sh
```

## Important Notes

### camelCase vs snake_case

The mix of naming conventions is **intentional**:
- **Better Auth tables** = camelCase (required by Better Auth)
- **Application tables** = snake_case (PostgreSQL standard)

### Profiles Table

The `profiles` table uses `user_id` as the PRIMARY KEY (not a separate `id` column). This directly references Better Auth's `user.id`.

### Daily Prompts Unique Constraint

The `daily_prompts_sent` table has a unique constraint that:
- ✅ Allows multiple test emails per day (`is_test = true`)
- ❌ Prevents multiple real daily prompts per day (`is_test = false`)

## Troubleshooting

### Permission Denied Errors

If you get permission errors, ensure the seedling_user has all necessary privileges:

```bash
sudo -u postgres psql -d seedling << EOF
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO seedling_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO seedling_user;
GRANT ALL PRIVILEGES ON DATABASE seedling TO seedling_user;
EOF
```

### Column Name Errors

If you see errors about column names not existing:
- Check if you're using camelCase for Better Auth tables
- Check if you're using snake_case for application tables
- Run the schema verification scripts

### Migration Already Applied

All migrations use `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`, so they're safe to re-run. They won't fail if tables already exist.

## Deployment Checklist

When deploying to a new system:

1. ✅ Install PostgreSQL
2. ✅ Create database and user (see Quick Start)
3. ✅ Run `complete_migration.sql`
4. ✅ Verify with `quick_schema_check.sh`
5. ✅ Update `.env` with database credentials
6. ✅ Set up Better Auth configuration
7. ✅ Configure email service (Resend API)

## Additional Resources

- See `BETTER_AUTH_CAMELCASE_FIX.md` for details on the camelCase issue
- See `DATABASE_MIGRATION_REVIEW.md` for complete migration history
- See `../README.md` for overall application setup
