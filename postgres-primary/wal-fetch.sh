#!/bin/sh

export AWS_ENC_KEY=$(cat /app/.pwd-base64)

aws s3 cp --sse-c-copy-source AES256 --sse-c-copy-source-key "$AWS_ENC_KEY" "s3://$PG_BACKUP_STORAGE_S3_BUCKET/$PG_BACKUP_STORAGE_S3_WAL_FOLDER/$1.gz" "$2.gz"
gunzip -c "$2.gz" > $2
rm "$2.gz"
