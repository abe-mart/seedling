# Database Migration Files - At a Glance

## 🎯 What You Need

### New Installation → Use ONE File

```
database/
  └── complete_migration.sql  ⭐ USE THIS!
      (354 lines, everything included)
```

**What it includes:**
- ✅ Better Auth tables (user, session, account, verification)
- ✅ Core tables (profiles, books, story_elements, prompts, responses)
- ✅ Daily prompts tables (preferences, tracking)
- ✅ All indexes and triggers
- ✅ All permissions

**Setup in 2 commands:**
```bash
# 1. Create database
sudo -u postgres psql << EOF
CREATE DATABASE seedling;
CREATE USER seedling_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE seedling TO seedling_user;
EOF

# 2. Run migration
psql -U postgres -d seedling -f database/complete_migration.sql
```

Done! ✨

---

## 📁 All Files

### Primary Files

| File | Purpose | When to Use |
|------|---------|-------------|
| `complete_migration.sql` | **Complete schema** | ⭐ New installations |
| `daily_prompts_migration_update.sql` | Add missing columns | Existing database updates |
| `README.md` | Setup guide | Reference documentation |

### Verification & Tools

| File | Purpose | Usage |
|------|---------|-------|
| `quick_schema_check.sh` | Fast schema overview | `./database/quick_schema_check.sh` |
| `verify_schema.sh` | Detailed verification | `./database/verify_schema.sh` |

### Legacy Files (For Reference Only)

| File | Purpose | Note |
|------|---------|------|
| `pi_migration.sql` | Original core schema | Now in complete_migration.sql |
| `daily_prompts_migration.sql` | Daily prompts feature | Now in complete_migration.sql |

---

## 🔄 Migration Timeline

```
v1.0 (Oct 2024)
  └── pi_migration.sql
      ├── Better Auth tables
      ├── Core application tables
      └── Basic indexes

v1.1 (Nov 2024)
  └── daily_prompts_migration.sql
      ├── daily_prompt_preferences
      └── daily_prompts_sent

v1.2 (Nov 2024)
  └── daily_prompts_migration_update.sql
      ├── Added: focus_element_ids
      ├── Added: is_test
      └── Fixed: unique index

v2.0 (Nov 2024) ⭐ CURRENT
  └── complete_migration.sql
      └── Everything combined!
```

---

## 🚀 Quick Commands

### Fresh Install
```bash
psql -U postgres -d seedling -f database/complete_migration.sql
```

### Update Existing
```bash
psql -U seedling_user -d seedling -f database/daily_prompts_migration_update.sql
```

### Verify Schema
```bash
./database/quick_schema_check.sh
```

---

## 📊 What Gets Created

### Tables (14 total)

**Authentication (4)**
- user, session, account, verification

**Core Application (7)**
- profiles, series, books, story_elements
- prompts, responses, user_settings

**Daily Prompts (2)**
- daily_prompt_preferences
- daily_prompts_sent

**Bonus**
- users (PostgreSQL default, unused)

### Indexes (20+)
- Performance indexes on all foreign keys
- Unique constraints where needed
- Conditional indexes for optimization

### Triggers (7)
- Auto-update timestamps on all tables

---

## 💡 Pro Tips

1. **Always use complete_migration.sql for new systems**
   - It's tested and includes everything
   - One command setup
   - No version conflicts

2. **Keep legacy files for reference**
   - Good for understanding history
   - Useful for debugging
   - Don't delete them

3. **Verify after migration**
   ```bash
   ./database/quick_schema_check.sh
   ```

4. **Backup before updates**
   ```bash
   pg_dump -U seedling_user seedling > backup.sql
   ```

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Permission denied | Run as `postgres` user or grant privileges |
| Column already exists | Normal! Migrations use IF NOT EXISTS |
| camelCase errors | Check you're querying correct table (Better Auth vs app tables) |
| Test emails blocked | Run the update migration to add `is_test` column |

---

**Need help?** See `database/README.md` for detailed documentation.
