#!/bin/bash

# 💾 ALTERGEN - Automated Backup Script
# Goal: Daily Postgres Dump

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_CONTAINER="altergen-db-primary"
DB_NAME="${POSTGRES_DB:-altergen}"
DB_USER="${POSTGRES_USER:-postgres}"

mkdir -p $BACKUP_DIR

echo "🚀 Starting backup of $DB_NAME..."

docker exec $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/backup_$TIMESTAMP.sql

if [ $? -eq 0 ]; then
    echo "✅ Backup successful: $BACKUP_DIR/backup_$TIMESTAMP.sql"
    # Compression
    gzip $BACKUP_DIR/backup_$TIMESTAMP.sql
    # Rotation: Keep last 7 days
    find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
else
    echo "❌ Backup failed!"
    exit 1
fi
