#!/bin/sh

gzip -c "$1" > "$1.gz"
openssl enc -aes-256-cbc -pbkdf2 -in "$1.gz" -out "$1.gz.enc" -pass file:/app/.pwd-hash
aws s3 cp "$1.gz.enc" "s3://$PG_BACKUP_STORAGE_S3_BUCKET/$PG_BACKUP_STORAGE_S3_WAL_FOLDER/$2.gz.enc"
rm "$1.gz.enc"
rm "$1.gz"
