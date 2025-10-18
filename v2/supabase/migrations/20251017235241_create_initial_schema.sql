/*
  # Initial Schema for AI Writing Prompt App

  ## Overview
  This migration creates the foundational database structure for an AI-powered writing prompt application
  that helps fiction writers build their story worlds through personalized prompts.

  ## New Tables

  ### 1. profiles
  - `id` (uuid, references auth.users)
  - `email` (text)
  - `display_name` (text)
  - `timezone` (text)
  - `preferred_genres` (text array)
  - `writing_frequency` (text)
  - `current_streak` (integer, default 0)
  - `longest_streak` (integer, default 0)
  - `last_prompt_date` (date)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. series
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `title` (text)
  - `description` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. books
  - `id` (uuid, primary key)
  - `series_id` (uuid, references series)
  - `user_id` (uuid, references profiles)
  - `title` (text)
  - `description` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. story_elements
  - `id` (uuid, primary key)
  - `book_id` (uuid, references books)
  - `user_id` (uuid, references profiles)
  - `element_type` (text: character, location, plot_point, item, theme)
  - `name` (text)
  - `description` (text)
  - `notes` (text)
  - `metadata` (jsonb for flexible additional data)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. prompts
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `book_id` (uuid, references books, nullable)
  - `prompt_text` (text)
  - `prompt_type` (text: character_deep_dive, plot_development, worldbuilding, dialogue, conflict_theme, general)
  - `prompt_mode` (text)
  - `element_references` (uuid array, references story_elements)
  - `generated_at` (timestamptz)
  - `created_at` (timestamptz)

  ### 6. responses
  - `id` (uuid, primary key)
  - `prompt_id` (uuid, references prompts)
  - `user_id` (uuid, references profiles)
  - `response_text` (text)
  - `element_tags` (uuid array, references story_elements)
  - `word_count` (integer, default 0)
  - `completed_at` (timestamptz)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 7. user_settings
  - `user_id` (uuid, primary key, references profiles)
  - `default_prompt_mode` (text)
  - `daily_reminder_enabled` (boolean, default false)
  - `reminder_time` (time)
  - `dark_mode` (boolean, default false)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage their own data
  - Users can only access their own profiles, series, books, elements, prompts, and responses
*/

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
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
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid REFERENCES series(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create story_elements table
CREATE TABLE IF NOT EXISTS story_elements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  element_type text NOT NULL CHECK (element_type IN ('character', 'location', 'plot_point', 'item', 'theme')),
  name text NOT NULL,
  description text DEFAULT '',
  notes text DEFAULT '',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  book_id uuid REFERENCES books(id) ON DELETE SET NULL,
  prompt_text text NOT NULL,
  prompt_type text DEFAULT 'general' CHECK (prompt_type IN ('character_deep_dive', 'plot_development', 'worldbuilding', 'dialogue', 'conflict_theme', 'general')),
  prompt_mode text,
  element_references uuid[] DEFAULT '{}',
  generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create responses table
CREATE TABLE IF NOT EXISTS responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  response_text text NOT NULL,
  element_tags uuid[] DEFAULT '{}',
  word_count integer DEFAULT 0,
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  default_prompt_mode text DEFAULT 'general',
  daily_reminder_enabled boolean DEFAULT false,
  reminder_time time,
  dark_mode boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
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

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE series ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for series
CREATE POLICY "Users can view own series"
  ON series FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own series"
  ON series FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own series"
  ON series FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own series"
  ON series FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for books
CREATE POLICY "Users can view own books"
  ON books FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own books"
  ON books FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own books"
  ON books FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own books"
  ON books FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for story_elements
CREATE POLICY "Users can view own story elements"
  ON story_elements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own story elements"
  ON story_elements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own story elements"
  ON story_elements FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own story elements"
  ON story_elements FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for prompts
CREATE POLICY "Users can view own prompts"
  ON prompts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prompts"
  ON prompts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prompts"
  ON prompts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompts"
  ON prompts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for responses
CREATE POLICY "Users can view own responses"
  ON responses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own responses"
  ON responses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own responses"
  ON responses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own responses"
  ON responses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for user_settings
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON user_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
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