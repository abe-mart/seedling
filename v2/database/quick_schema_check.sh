#!/bin/bash
# Quick Schema Check (using postgres user, no password needed)
# Shows key database structure info

echo "📊 Database Schema Quick Check"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Function to run psql as postgres user
run_query() {
    sudo -u postgres psql -d seedling -t -c "$1" 2>/dev/null
}

echo "1️⃣  Better Auth Tables (camelCase columns):"
echo ""
echo "   user table:"
run_query "SELECT column_name FROM information_schema.columns WHERE table_name = 'user' ORDER BY ordinal_position;" | sed 's/^/      /'
echo ""

echo "   session table:"
run_query "SELECT column_name FROM information_schema.columns WHERE table_name = 'session' ORDER BY ordinal_position;" | sed 's/^/      /'
echo ""

echo "2️⃣  Key Application Tables:"
echo ""
echo "   profiles (user_id is PRIMARY KEY):"
run_query "SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles' ORDER BY ordinal_position;" | sed 's/^/      /'
echo ""

echo "3️⃣  Daily Prompts Tables:"
echo ""
echo "   daily_prompt_preferences:"
has_focus=$(run_query "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'daily_prompt_preferences' AND column_name = 'focus_element_ids';")
if [ "${has_focus// /}" = "1" ]; then
    echo "      ✅ focus_element_ids column exists"
else
    echo "      ❌ focus_element_ids column MISSING"
fi

echo ""
echo "   daily_prompts_sent:"
has_test=$(run_query "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'daily_prompts_sent' AND column_name = 'is_test';")
if [ "${has_test// /}" = "1" ]; then
    echo "      ✅ is_test column exists"
else
    echo "      ❌ is_test column MISSING"
fi

echo ""
echo "4️⃣  Row Counts:"
echo ""
users=$(run_query "SELECT COUNT(*) FROM \"user\";")
echo "   Users: ${users// /}"
books=$(run_query "SELECT COUNT(*) FROM books;")
echo "   Books: ${books// /}"
elements=$(run_query "SELECT COUNT(*) FROM story_elements;")
echo "   Story Elements: ${elements// /}"
prompts=$(run_query "SELECT COUNT(*) FROM prompts;")
echo "   Prompts: ${prompts// /}"
responses=$(run_query "SELECT COUNT(*) FROM responses;")
echo "   Responses: ${responses// /}"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ Schema check complete!"
echo ""
