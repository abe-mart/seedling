#!/bin/bash
# Database setup script for Raspberry Pi
# This script sets up PostgreSQL and applies migrations

set -e

echo "🗄️  Setting up PostgreSQL database..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
DB_NAME="seedling"
DB_USER="seedling_user"
DB_PASSWORD=""
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATION_FILE="${SCRIPT_DIR}/supabase/migrations/20251017235241_create_initial_schema.sql"

# Prompt for password
read -sp "Enter password for database user '${DB_USER}': " DB_PASSWORD
echo

if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}Error: Password cannot be empty${NC}"
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}PostgreSQL is not installed. Installing...${NC}"
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# Check if database exists
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo -e "${YELLOW}Database '$DB_NAME' already exists${NC}"
    read -p "Drop and recreate? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;"
        sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;"
    else
        echo "Skipping database creation"
        exit 0
    fi
fi

# Create database and user
echo -e "${GREEN}Creating database and user...${NC}"
sudo -u postgres psql -v ON_ERROR_STOP=1 << EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
GRANT ALL ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
EOF

# Apply migrations
if [ -f "$MIGRATION_FILE" ]; then
    echo -e "${GREEN}Applying database migrations...${NC}"
    # Copy migration file to temp location that postgres user can access
    TEMP_MIGRATION="/tmp/seedling_migration_$(date +%s).sql"
    cp "$MIGRATION_FILE" "$TEMP_MIGRATION"
    chmod 644 "$TEMP_MIGRATION"
    
    # Apply migration
    sudo -u postgres psql -d "$DB_NAME" -f "$TEMP_MIGRATION"
    
    # Clean up temp file
    rm -f "$TEMP_MIGRATION"
    
    echo -e "${GREEN}✅ Migrations applied successfully${NC}"
else
    echo -e "${YELLOW}Warning: Migration file not found at: $MIGRATION_FILE${NC}"
    echo -e "${YELLOW}You can apply it manually later with:${NC}"
    echo -e "  sudo -u postgres psql -d $DB_NAME -f supabase/migrations/20251017235241_create_initial_schema.sql"
fi

echo ""
echo -e "${GREEN}✅ Database setup complete!${NC}"
echo ""
echo "Database connection string:"
echo "postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"
echo ""
echo "Note: Save this connection string securely!"
echo "You'll need it for Supabase self-hosted configuration."
