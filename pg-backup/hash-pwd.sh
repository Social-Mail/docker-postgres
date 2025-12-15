#!/bin/sh

set -e

echo "$PG_BACKUP_STORAGE_S3_ENC_PASSWORD" > /app/.pwd
sha256sum /app/.pwd | head -c 32 > /app/.pwd-hash
rm /app/.pwd
