#!/bin/sh

aws s3 cp --sse-c AES256 --sse-c-key fileb:///app/.pwd-hash "s3://$PG_BACKUP_STORAGE_S3_BUCKET/$PG_BACKUP_STORAGE_S3_WAL_FOLDER/$1.gz" "$2.gz"
gunzip -c "$2.gz" > $2
rm "$2.gz"
