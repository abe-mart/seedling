#!/bin/bash
# Backup script for Raspberry Pi deployment
# This script backs up the PostgreSQL database and application data

set -e

# Configuration
BACKUP_DIR="${HOME}/seedling-backups"
DB_NAME="seedling"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/seedling_backup_${TIMESTAMP}.sql"
RETENTION_DAYS=7

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔄 Starting Seedling backup...${NC}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL database
echo -e "${GREEN}Backing up database...${NC}"
if sudo -u postgres pg_dump "$DB_NAME" > "$BACKUP_FILE"; then
    echo -e "${GREEN}✅ Database backed up to: $BACKUP_FILE${NC}"
    
    # Compress backup
    echo -e "${GREEN}Compressing backup...${NC}"
    gzip "$BACKUP_FILE"
    echo -e "${GREEN}✅ Compressed to: ${BACKUP_FILE}.gz${NC}"
else
    echo -e "${RED}❌ Database backup failed!${NC}"
    exit 1
fi

# Backup .env file (optional but useful)
if [ -f .env ]; then
    echo -e "${GREEN}Backing up environment configuration...${NC}"
    cp .env "${BACKUP_DIR}/.env_${TIMESTAMP}"
    echo -e "${GREEN}✅ Environment backed up${NC}"
fi

# Clean up old backups
echo -e "${GREEN}Cleaning up old backups (older than ${RETENTION_DAYS} days)...${NC}"
find "$BACKUP_DIR" -name "seedling_backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete
find "$BACKUP_DIR" -name ".env_*" -type f -mtime +${RETENTION_DAYS} -delete

# List recent backups
echo -e "${GREEN}Recent backups:${NC}"
ls -lh "$BACKUP_DIR" | tail -5

# Calculate backup size
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo -e "${GREEN}Total backup size: ${BACKUP_SIZE}${NC}"

echo -e "${GREEN}✅ Backup complete!${NC}"
echo ""
echo "To restore from this backup:"
echo "  gunzip ${BACKUP_FILE}.gz"
echo "  sudo -u postgres psql ${DB_NAME} < ${BACKUP_FILE}"
