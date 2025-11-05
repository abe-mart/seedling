-- Daily Writing Prompts Feature Migration
-- Run this with: psql -U seedling_user -d seedling -f daily_prompts_migration.sql

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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_prompt_preferences_enabled ON daily_prompt_preferences(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_daily_prompts_sent_user_id ON daily_prompts_sent(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_prompts_sent_sent_at ON daily_prompts_sent(sent_at);
CREATE INDEX IF NOT EXISTS idx_daily_prompts_sent_responded ON daily_prompts_sent(responded_at) WHERE responded_at IS NOT NULL;
-- Ensure only one real daily prompt per user per day (exclude test emails from uniqueness constraint)
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_prompts_sent_unique_user_day ON daily_prompts_sent(user_id, (DATE(sent_at))) WHERE is_test = false;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_daily_prompt_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_daily_prompt_preferences_timestamp ON daily_prompt_preferences;
CREATE TRIGGER update_daily_prompt_preferences_timestamp
    BEFORE UPDATE ON daily_prompt_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_prompt_preferences_updated_at();

-- Grant permissions
GRANT ALL PRIVILEGES ON daily_prompt_preferences TO seedling_user;
GRANT ALL PRIVILEGES ON daily_prompts_sent TO seedling_user;
GRANT USAGE, SELECT ON SEQUENCE daily_prompts_sent_id_seq TO seedling_user;

-- Default preferences for existing users (optional - uncomment if desired)
-- INSERT INTO daily_prompt_preferences (user_id, enabled)
-- SELECT id, false FROM "user"
-- ON CONFLICT (user_id) DO NOTHING;

COMMENT ON TABLE daily_prompt_preferences IS 'User preferences for daily writing prompt delivery';
COMMENT ON TABLE daily_prompts_sent IS 'Log of all daily prompts sent to users with engagement tracking';
