#!/bin/sh
aws s3 cp "s3://$PG_BACKUP_STORAGE_S3_BUCKET/$PG_BACKUP_STORAGE_S3_WAL_FOLDER/$1" "$2.gz"
gunzip -c "$2.gz" > $2
rm "$2.gz"
