#!/bin/bash
# SuperFCAI Database Backup Script
# This script performs a safe online backup of the SQLite database.

CONTAINER_NAME="superfcai"
DB_PATH="/app/data/database.sqlite"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="${BACKUP_DIR}/superfcai_${TIMESTAMP}.bak"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

echo "Starting database backup for ${CONTAINER_NAME}..."

# Use sqlite3 .backup command for safe online backup (copying while the DB is in use)
docker exec "${CONTAINER_NAME}" sqlite3 "${DB_PATH}" ".backup '/app/data/temp_backup.bak'"

# Copy the backup from the container to the host
docker cp "${CONTAINER_NAME}:/app/data/temp_backup.bak" "${BACKUP_FILE}"

# Remove the temp file from the container
docker exec "${CONTAINER_NAME}" rm "/app/data/temp_backup.bak"

if [ $? -eq 0 ]; then
    echo "Backup successful: ${BACKUP_FILE}"
    # Keep only the last 30 backups to save space
    ls -t ${BACKUP_DIR}/superfcai_*.bak | tail -n +31 | xargs -r rm
else
    echo "Backup failed!"
    exit 1
fi
