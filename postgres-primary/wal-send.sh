#!/bin/sh
gzip -c "$2" > "$2.gz"
aws s3 cp $1 "s3://$PG_BACKUP_STORAGE_S3_BUCKET/$PG_BACKUP_STORAGE_S3_WAL_FOLDER/$2.gz"
rm "$2.gz"
