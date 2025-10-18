/*
  # PostgreSQL-Only Schema (Single User)
  
  Simplified schema for a single-user writing app.
  No authentication required - everything belongs to one user.
*/

-- Create profiles table (single user profile)
CREATE TABLE IF NOT EXISTS profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text,
  timezone text DEFAULT 'UTC',
  preferred_genres text[] DEFAULT '{}',
  writing_frequency text DEFAULT 'daily',
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_prompt_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create series table
CREATE TABLE IF NOT EXISTS series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid REFERENCES series(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create story_elements table
CREATE TABLE IF NOT EXISTS story_elements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  element_type text NOT NULL CHECK (element_type IN ('character', 'location', 'plot_point', 'item', 'theme')),
  name text NOT NULL,
  description text,
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books(id) ON DELETE SET NULL,
  prompt_text text NOT NULL,
  prompt_type text NOT NULL CHECK (prompt_type IN ('character_deep_dive', 'plot_development', 'worldbuilding', 'dialogue', 'conflict_theme', 'general')),
  prompt_mode text,
  element_references uuid[],
  generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create responses table
CREATE TABLE IF NOT EXISTS responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid REFERENCES prompts(id) ON DELETE CASCADE NOT NULL,
  response_text text NOT NULL,
  element_tags uuid[],
  word_count integer DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  default_prompt_mode text,
  daily_reminder_enabled boolean DEFAULT false,
  reminder_time time,
  dark_mode boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_books_series_id ON books(series_id);
CREATE INDEX IF NOT EXISTS idx_story_elements_book_id ON story_elements(book_id);
CREATE INDEX IF NOT EXISTS idx_story_elements_type ON story_elements(element_type);
CREATE INDEX IF NOT EXISTS idx_prompts_book_id ON prompts(book_id);
CREATE INDEX IF NOT EXISTS idx_prompts_type ON prompts(prompt_type);
CREATE INDEX IF NOT EXISTS idx_responses_prompt_id ON responses(prompt_id);
CREATE INDEX IF NOT EXISTS idx_responses_completed ON responses(completed_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profile_updated_at BEFORE UPDATE ON profile
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_series_updated_at BEFORE UPDATE ON series
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_story_elements_updated_at BEFORE UPDATE ON story_elements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_responses_updated_at BEFORE UPDATE ON responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default profile and settings for single user
INSERT INTO profile (id, display_name) VALUES (gen_random_uuid(), 'Writer') ON CONFLICT DO NOTHING;
INSERT INTO user_settings (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;

-- Grant permissions to seedling_user
GRANT ALL ON ALL TABLES IN SCHEMA public TO seedling_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO seedling_user;
