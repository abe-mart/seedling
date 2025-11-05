-- Update existing daily prompts tables with missing columns
-- Run this if you already have the daily prompts tables but need to add missing columns
-- psql -U seedling_user -d seedling -f daily_prompts_migration_update.sql

-- Add focus_element_ids to daily_prompt_preferences if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_prompt_preferences' 
        AND column_name = 'focus_element_ids'
    ) THEN
        ALTER TABLE daily_prompt_preferences 
        ADD COLUMN focus_element_ids UUID[] DEFAULT '{}';
        RAISE NOTICE '✅ Added focus_element_ids column to daily_prompt_preferences';
    ELSE
        RAISE NOTICE '⏭️  Column focus_element_ids already exists in daily_prompt_preferences';
    END IF;
END $$;

-- Add is_test to daily_prompts_sent if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_prompts_sent' 
        AND column_name = 'is_test'
    ) THEN
        ALTER TABLE daily_prompts_sent 
        ADD COLUMN is_test BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Added is_test column to daily_prompts_sent';
    ELSE
        RAISE NOTICE '⏭️  Column is_test already exists in daily_prompts_sent';
    END IF;
END $$;

-- Drop and recreate the unique index to exclude test emails
DO $$
BEGIN
    -- Drop old index if it exists
    DROP INDEX IF EXISTS idx_daily_prompts_sent_unique_user_day;
    
    -- Create new index that excludes test emails
    CREATE UNIQUE INDEX idx_daily_prompts_sent_unique_user_day 
    ON daily_prompts_sent(user_id, (DATE(sent_at))) 
    WHERE is_test = false;
    
    RAISE NOTICE '✅ Updated unique index to exclude test emails';
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ Daily prompts migration update completed successfully!';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Added columns:';
    RAISE NOTICE '   • focus_element_ids to daily_prompt_preferences';
    RAISE NOTICE '   • is_test to daily_prompts_sent';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Updated indexes:';
    RAISE NOTICE '   • Unique constraint now excludes test emails';
    RAISE NOTICE '';
END $$;
