#!/bin/bash
# Database Schema Verification Script
# Checks if all required columns exist in the database

echo "🔍 Verifying Database Schema..."
echo ""

# Database connection details
DB_NAME="${DB_NAME:-seedling}"
DB_USER="${DB_USER:-seedling_user}"

# Function to check if a column exists
check_column() {
    local table=$1
    local column=$2
    
    result=$(psql -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = '$table' 
            AND column_name = '$column'
        );
    " 2>&1)
    
    if echo "$result" | grep -q "t"; then
        echo "  ✅ $table.$column exists"
        return 0
    else
        echo "  ❌ $table.$column MISSING"
        return 1
    fi
}

# Function to check if a table exists
check_table() {
    local table=$1
    
    result=$(psql -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_name = '$table'
        );
    " 2>&1)
    
    if echo "$result" | grep -q "t"; then
        echo "✅ Table: $table"
        return 0
    else
        echo "❌ Table: $table MISSING"
        return 1
    fi
}

missing_items=0

# Check core tables
echo "📋 Core Tables:"
for table in user session account verification profiles series books story_elements prompts responses user_settings; do
    if ! check_table "$table"; then
        ((missing_items++))
    fi
done
echo ""

# Check Better Auth camelCase columns
echo "🔤 Better Auth camelCase Columns:"
check_column "user" "emailVerified" || ((missing_items++))
check_column "session" "userId" || ((missing_items++))
check_column "account" "accountId" || ((missing_items++))
echo ""

# Check daily prompts tables
echo "📧 Daily Prompts Tables:"
if check_table "daily_prompt_preferences"; then
    check_column "daily_prompt_preferences" "focus_element_ids" || ((missing_items++))
fi
echo ""

if check_table "daily_prompts_sent"; then
    check_column "daily_prompts_sent" "is_test" || ((missing_items++))
fi
echo ""

# Check critical indexes
echo "🔧 Critical Indexes:"
result=$(psql -U "$DB_USER" -d "$DB_NAME" -t -c "
    SELECT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = 'idx_daily_prompts_sent_unique_user_day'
    );
" 2>&1)

if echo "$result" | grep -q "t"; then
    echo "  ✅ Unique index on daily_prompts_sent (user_id, date)"
else
    echo "  ❌ Unique index MISSING"
    ((missing_items++))
fi
echo ""

# Summary
echo "════════════════════════════════════════"
if [ $missing_items -eq 0 ]; then
    echo "✅ Database schema is up to date!"
    echo "════════════════════════════════════════"
    exit 0
else
    echo "⚠️  Found $missing_items missing items"
    echo "════════════════════════════════════════"
    echo ""
    echo "To fix, run:"
    echo "  psql -U $DB_USER -d $DB_NAME -f database/daily_prompts_migration_update.sql"
    echo ""
    exit 1
fi
