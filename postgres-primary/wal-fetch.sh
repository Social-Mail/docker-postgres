#!/bin/sh

set -e

aws s3 cp "s3://$PG_BACKUP_STORAGE_S3_BUCKET/$PG_BACKUP_STORAGE_S3_WAL_FOLDER/$1.gz.enc" "$2.gz.enc"
openssl enc -d -aes-256-cbc -pbkdf2 -in "$2.gz.enc" -out "$2.gz" -pass file:/app/.pwd-hash
gunzip -c "$2.gz" > $2
rm "$2.gz.enc"
rm "$2.gz"
