/*
  # Daily Prompts Feature for Supabase
  
  This migration adds the daily prompts functionality to the Supabase schema.
  It should be run after the initial schema migration.
  
  ## New Tables
  
  ### daily_prompt_preferences
  - User preferences for daily prompt delivery
  - Includes scheduling, content preferences, and smart features
  
  ### daily_prompts_sent
  - Log of all daily prompts sent to users
  - Tracks engagement (opens, responses, skips)
*/

-- Table for user preferences for daily prompts
CREATE TABLE IF NOT EXISTS daily_prompt_preferences (
    user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    enabled boolean DEFAULT false,
    delivery_time time DEFAULT '09:00:00',
    timezone text DEFAULT 'America/New_York',
    focus_story_id uuid REFERENCES books(id) ON DELETE SET NULL,
    focus_element_ids uuid[] DEFAULT '{}',
    prompt_rotation text DEFAULT 'intelligent' CHECK (prompt_rotation IN ('intelligent', 'random', 'sequential')),
    
    -- Prompt type preferences
    include_character boolean DEFAULT true,
    include_plot boolean DEFAULT true,
    include_worldbuilding boolean DEFAULT true,
    include_dialogue boolean DEFAULT true,
    include_conflict boolean DEFAULT true,
    include_general boolean DEFAULT true,
    
    -- Smart features
    focus_underdeveloped boolean DEFAULT true,
    avoid_repetition_days integer DEFAULT 7,
    include_context boolean DEFAULT true,
    include_previous_answers boolean DEFAULT true,
    
    -- Email format and extras
    email_format text DEFAULT 'minimal' CHECK (email_format IN ('minimal', 'detailed', 'inspirational')),
    send_streak_warning boolean DEFAULT true,
    weekly_summary boolean DEFAULT false,
    pause_after_skips integer DEFAULT 3,
    
    -- State tracking
    consecutive_skips integer DEFAULT 0,
    last_prompt_sent_at timestamptz,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Table for tracking sent prompts
CREATE TABLE IF NOT EXISTS daily_prompts_sent (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    prompt_id uuid NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    element_id uuid REFERENCES story_elements(id) ON DELETE SET NULL,
    
    -- Timing
    sent_at timestamptz NOT NULL DEFAULT now(),
    opened_at timestamptz,
    responded_at timestamptz,
    
    -- Response tracking
    response_id uuid REFERENCES responses(id) ON DELETE SET NULL,
    skipped boolean DEFAULT false,
    skip_reason text,
    
    -- Email details
    email_format text NOT NULL,
    resend_email_id text,
    is_test boolean DEFAULT false
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_prompt_preferences_enabled 
    ON daily_prompt_preferences(enabled) WHERE enabled = true;
    
CREATE INDEX IF NOT EXISTS idx_daily_prompts_sent_user_id 
    ON daily_prompts_sent(user_id);
    
CREATE INDEX IF NOT EXISTS idx_daily_prompts_sent_sent_at 
    ON daily_prompts_sent(sent_at);
    
CREATE INDEX IF NOT EXISTS idx_daily_prompts_sent_responded 
    ON daily_prompts_sent(responded_at) WHERE responded_at IS NOT NULL;

-- Ensure only one real daily prompt per user per day (exclude test emails)
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_prompts_sent_unique_user_day 
    ON daily_prompts_sent(user_id, (DATE(sent_at))) 
    WHERE is_test = false;

-- Enable Row Level Security
ALTER TABLE daily_prompt_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_prompts_sent ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_prompt_preferences
CREATE POLICY "Users can view own daily prompt preferences"
    ON daily_prompt_preferences FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily prompt preferences"
    ON daily_prompt_preferences FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily prompt preferences"
    ON daily_prompt_preferences FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily prompt preferences"
    ON daily_prompt_preferences FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- RLS Policies for daily_prompts_sent
CREATE POLICY "Users can view own daily prompts sent"
    ON daily_prompts_sent FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily prompts sent"
    ON daily_prompts_sent FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily prompts sent"
    ON daily_prompts_sent FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Trigger for automatic updated_at updates
CREATE TRIGGER update_daily_prompt_preferences_updated_at 
    BEFORE UPDATE ON daily_prompt_preferences
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE daily_prompt_preferences IS 'User preferences for daily writing prompt delivery';
COMMENT ON TABLE daily_prompts_sent IS 'Log of all daily prompts sent to users with engagement tracking';
COMMENT ON COLUMN daily_prompt_preferences.focus_element_ids IS 'Optional array of specific element IDs to focus on within a story';
COMMENT ON COLUMN daily_prompts_sent.is_test IS 'Marks test emails that should not count toward daily limit';
