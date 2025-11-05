/*
  # Complete PostgreSQL Schema for StorySeed
  
  This migration creates the complete database schema for StorySeed including:
  - Better Auth authentication tables (camelCase columns)
  - Core application tables (series, books, story elements, prompts, responses)
  - Daily prompts feature tables
  
  Compatible with Better Auth's user management system.
  
  ## Prerequisites
  1. PostgreSQL database created: CREATE DATABASE seedling;
  2. Database user created: CREATE USER seedling_user WITH PASSWORD 'your_password';
  3. User granted privileges: GRANT ALL PRIVILEGES ON DATABASE seedling TO seedling_user;
  
  ## How to Run
  Run this on your PostgreSQL installation:
  
  psql -U postgres -d seedling -f complete_migration.sql
  
  ## Important Notes
  - Better Auth tables use camelCase (e.g., emailVerified, userId)
  - Application tables use snake_case (e.g., user_id, created_at)
  - This is intentional and required by Better Auth
*/

-- ==================== BETTER AUTH TABLES ====================
-- IMPORTANT: Better Auth uses camelCase for column names!

CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  name TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
  "refreshTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  password TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE,
  "updatedAt" TIMESTAMP WITH TIME ZONE
);

-- ==================== APPLICATION TABLES ====================

-- User profiles (extends Better Auth user table)
CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  timezone TEXT DEFAULT 'UTC',
  preferred_genres TEXT[] DEFAULT '{}',
  writing_frequency TEXT DEFAULT 'daily',
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_prompt_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Series table
CREATE TABLE IF NOT EXISTS series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Books table
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID REFERENCES series(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Story elements table
CREATE TABLE IF NOT EXISTS story_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  element_type TEXT NOT NULL CHECK (element_type IN ('character', 'location', 'plot_point', 'item', 'theme')),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  prompt_text TEXT NOT NULL,
  prompt_type TEXT DEFAULT 'general' CHECK (prompt_type IN ('character_deep_dive', 'plot_development', 'worldbuilding', 'dialogue', 'conflict_theme', 'general')),
  prompt_mode TEXT DEFAULT 'general',
  element_references UUID[] DEFAULT '{}',
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Responses table
CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  element_tags UUID[] DEFAULT '{}',
  word_count INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  default_prompt_mode TEXT DEFAULT 'general',
  daily_reminder_enabled BOOLEAN DEFAULT false,
  reminder_time TIME,
  dark_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== DAILY PROMPTS FEATURE ====================

-- Table for user preferences for daily prompts
CREATE TABLE IF NOT EXISTS daily_prompt_preferences (
  user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  delivery_time TIME DEFAULT '09:00:00',
  timezone TEXT DEFAULT 'America/New_York',
  focus_story_id UUID REFERENCES books(id) ON DELETE SET NULL,
  focus_element_ids UUID[] DEFAULT '{}',
  prompt_rotation TEXT DEFAULT 'intelligent' CHECK (prompt_rotation IN ('intelligent', 'random', 'sequential')),
  
  -- Prompt type preferences
  include_character BOOLEAN DEFAULT true,
  include_plot BOOLEAN DEFAULT true,
  include_worldbuilding BOOLEAN DEFAULT true,
  include_dialogue BOOLEAN DEFAULT true,
  include_conflict BOOLEAN DEFAULT true,
  include_general BOOLEAN DEFAULT true,
  
  -- Smart features
  focus_underdeveloped BOOLEAN DEFAULT true,
  avoid_repetition_days INTEGER DEFAULT 7,
  include_context BOOLEAN DEFAULT true,
  include_previous_answers BOOLEAN DEFAULT true,
  
  -- Email format and extras
  email_format TEXT DEFAULT 'minimal' CHECK (email_format IN ('minimal', 'detailed', 'inspirational')),
  send_streak_warning BOOLEAN DEFAULT true,
  weekly_summary BOOLEAN DEFAULT false,
  pause_after_skips INTEGER DEFAULT 3,
  
  -- State tracking
  consecutive_skips INTEGER DEFAULT 0,
  last_prompt_sent_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for tracking sent prompts
CREATE TABLE IF NOT EXISTS daily_prompts_sent (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  element_id UUID REFERENCES story_elements(id) ON DELETE SET NULL,
  
  -- Timing
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  opened_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  
  -- Response tracking
  response_id UUID REFERENCES responses(id) ON DELETE SET NULL,
  skipped BOOLEAN DEFAULT false,
  skip_reason TEXT,
  
  -- Email details
  email_format TEXT NOT NULL,
  resend_email_id TEXT,
  is_test BOOLEAN DEFAULT false
);

-- ==================== INDEXES ====================

-- Better Auth tables use camelCase
CREATE INDEX IF NOT EXISTS idx_session_user_id ON session("userId");
CREATE INDEX IF NOT EXISTS idx_account_user_id ON account("userId");

-- Application tables
CREATE INDEX IF NOT EXISTS idx_series_user_id ON series(user_id);
CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_series_id ON books(series_id);
CREATE INDEX IF NOT EXISTS idx_story_elements_book_id ON story_elements(book_id);
CREATE INDEX IF NOT EXISTS idx_story_elements_user_id ON story_elements(user_id);
CREATE INDEX IF NOT EXISTS idx_story_elements_type ON story_elements(element_type);
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_book_id ON prompts(book_id);
CREATE INDEX IF NOT EXISTS idx_prompts_generated_at ON prompts(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_responses_user_id ON responses(user_id);
CREATE INDEX IF NOT EXISTS idx_responses_prompt_id ON responses(prompt_id);
CREATE INDEX IF NOT EXISTS idx_responses_completed_at ON responses(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Daily prompts indexes
CREATE INDEX IF NOT EXISTS idx_daily_prompt_preferences_enabled ON daily_prompt_preferences(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_daily_prompts_sent_user_id ON daily_prompts_sent(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_prompts_sent_sent_at ON daily_prompts_sent(sent_at);
CREATE INDEX IF NOT EXISTS idx_daily_prompts_sent_responded ON daily_prompts_sent(responded_at) WHERE responded_at IS NOT NULL;

-- Ensure only one real daily prompt per user per day (exclude test emails)
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_prompts_sent_unique_user_day 
  ON daily_prompts_sent(user_id, (DATE(sent_at))) 
  WHERE is_test = false;

-- ==================== FUNCTIONS ====================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================== TRIGGERS ====================

-- Triggers for automatic updated_at updates
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_series_updated_at ON series;
CREATE TRIGGER update_series_updated_at BEFORE UPDATE ON series
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_books_updated_at ON books;
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_story_elements_updated_at ON story_elements;
CREATE TRIGGER update_story_elements_updated_at BEFORE UPDATE ON story_elements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_responses_updated_at ON responses;
CREATE TRIGGER update_responses_updated_at BEFORE UPDATE ON responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_prompt_preferences_timestamp ON daily_prompt_preferences;
CREATE TRIGGER update_daily_prompt_preferences_timestamp
  BEFORE UPDATE ON daily_prompt_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== PERMISSIONS ====================

-- Grant all privileges to seedling_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO seedling_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO seedling_user;

-- ==================== TABLE COMMENTS ====================

COMMENT ON TABLE "user" IS 'Better Auth user table - uses camelCase columns';
COMMENT ON TABLE session IS 'Better Auth session table - uses camelCase columns';
COMMENT ON TABLE account IS 'Better Auth account table - uses camelCase columns';
COMMENT ON TABLE verification IS 'Better Auth verification table - uses camelCase columns';
COMMENT ON TABLE profiles IS 'Extended user profile information';
COMMENT ON TABLE series IS 'Book series for organizing related books';
COMMENT ON TABLE books IS 'Individual books or writing projects';
COMMENT ON TABLE story_elements IS 'Story elements (characters, locations, plot points, items, themes)';
COMMENT ON TABLE prompts IS 'AI-generated writing prompts';
COMMENT ON TABLE responses IS 'User responses to writing prompts';
COMMENT ON TABLE user_settings IS 'User preferences and settings';
COMMENT ON TABLE daily_prompt_preferences IS 'User preferences for daily writing prompt delivery';
COMMENT ON TABLE daily_prompts_sent IS 'Log of all daily prompts sent to users with engagement tracking';

-- ==================== SUCCESS MESSAGE ====================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ StorySeed Complete Database Schema Created Successfully!';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Tables Created:';
  RAISE NOTICE '   Authentication (Better Auth):';
  RAISE NOTICE '     • user, session, account, verification';
  RAISE NOTICE '';
  RAISE NOTICE '   Core Application:';
  RAISE NOTICE '     • profiles, series, books, story_elements';
  RAISE NOTICE '     • prompts, responses, user_settings';
  RAISE NOTICE '';
  RAISE NOTICE '   Daily Prompts Feature:';
  RAISE NOTICE '     • daily_prompt_preferences, daily_prompts_sent';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Ready for Better Auth Integration';
  RAISE NOTICE '📧 Daily Prompts Email Feature Enabled';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Configure your .env file with database credentials';
  RAISE NOTICE '2. Set up Better Auth in your application';
  RAISE NOTICE '3. Configure email service (Resend) for daily prompts';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;
