#!/bin/sh
aws s3 cp "s3://$PG_BACKUP_STORAGE_S3_BUCKET/wal/$1" $1
