# Better Auth CamelCase Migration Fix

## Issue
Better Auth automatically creates database tables with **camelCase** column names, but the original migration file used **snake_case**. This caused a mismatch between the migration file and the actual working database.

## What Was Fixed

### 1. Better Auth Tables - Changed to camelCase

#### `user` table:
```sql
-- BEFORE (wrong):
email_verified, created_at, updated_at

-- AFTER (correct):
"emailVerified", "createdAt", "updatedAt"
```

#### `session` table:
```sql
-- BEFORE (wrong):
expires_at, created_at, updated_at, ip_address, user_agent, user_id

-- AFTER (correct):
"expiresAt", "createdAt", "updatedAt", "ipAddress", "userAgent", "userId"
```

#### `account` table:
```sql
-- BEFORE (wrong):
account_id, provider_id, user_id, access_token, refresh_token, 
id_token, access_token_expires_at, refresh_token_expires_at, 
created_at, updated_at

-- AFTER (correct):
"accountId", "providerId", "userId", "accessToken", "refreshToken",
"idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt",
"createdAt", "updatedAt"
```

#### `verification` table:
```sql
-- BEFORE (wrong):
expires_at, created_at, updated_at

-- AFTER (correct):
"expiresAt", "createdAt", "updatedAt"
```

### 2. Profiles Table Structure

The actual database has `profiles.user_id` as the PRIMARY KEY, not a separate UUID `id` column.

```sql
-- BEFORE (wrong):
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  ...
);

-- AFTER (correct):
CREATE TABLE profiles (
  user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  ...
);
```

### 3. Indexes Updated

```sql
-- BEFORE (wrong):
CREATE INDEX idx_session_user_id ON session(user_id);
CREATE INDEX idx_account_user_id ON account(user_id);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- AFTER (correct):
CREATE INDEX idx_session_user_id ON session("userId");  -- camelCase
CREATE INDEX idx_account_user_id ON account("userId");   -- camelCase
-- profiles.user_id is PRIMARY KEY, no index needed
```

## Why This Matters

1. **Fresh installations** using the migration file would have created tables with wrong column names
2. **Schema documentation** needs to match the actual database
3. **Database exports/imports** would fail if using the wrong schema
4. **Future migrations** might fail if they reference wrong column names

## Current State

✅ **Migration file now matches working database exactly**
- Better Auth tables use camelCase (wrapped in quotes for PostgreSQL)
- Application tables use snake_case (standard PostgreSQL convention)
- All column names verified against actual database structure

## Testing

You can verify the schema matches by running:
```bash
./database/verify_schema.sh
```

This will check:
- All tables exist
- Better Auth camelCase columns are correct
- Daily prompts columns are present
- Required indexes are in place

## Notes

- **Quotes are required** in PostgreSQL when using camelCase identifiers
- Better Auth is opinionated about using camelCase - this is not configurable
- Our application tables still use snake_case (e.g., `user_id`, `created_at`) which is fine
- The mix of camelCase and snake_case is intentional: Better Auth tables vs. our application tables
