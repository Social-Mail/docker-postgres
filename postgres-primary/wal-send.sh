#!/bin/sh
export AWS_ENC_KEY=$(cat /app/.pwd-base64)
gzip -c "$1" > "$1.gz"
aws s3 cp --sse-c AES256 --sse-c-key "$AWS_ENC_KEY" "$1.gz" "s3://$PG_BACKUP_STORAGE_S3_BUCKET/$PG_BACKUP_STORAGE_S3_WAL_FOLDER/$2.gz"
rm "$1.gz"
