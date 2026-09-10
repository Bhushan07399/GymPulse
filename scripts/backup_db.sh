#!/bin/bash
set -e

# GymPulse PostgreSQL Production Backup Script
# Usage: ./scripts/backup_db.sh

BACKUP_DIR="${BACKUP_DIR:-/var/backups/gympulse}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="${DB_NAME:-gympulse_prod}"
DB_USER="${DB_USER:-gympulse_user}"
DB_HOST="${DB_HOST:-localhost}"
FILENAME="$BACKUP_DIR/${DB_NAME}_$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting PostgreSQL backup for $DB_NAME on $DB_HOST..."
pg_dump -U "$DB_USER" -h "$DB_HOST" "$DB_NAME" | gzip > "$FILENAME"

echo "[$(date)] Backup created successfully: $FILENAME"

# Local retention policy: remove files older than 30 days
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +30 -delete
echo "[$(date)] Cleaned up backups older than 30 days."

# Sync to off-site cloud storage (Cloudflare R2 / AWS S3) if rclone is configured
if command -v rclone &> /dev/null; then
    echo "[$(date)] Syncing backups to remote storage..."
    rclone sync "$BACKUP_DIR" r2:gympulse-db-backups/
    echo "[$(date)] Remote backup sync complete."
fi
