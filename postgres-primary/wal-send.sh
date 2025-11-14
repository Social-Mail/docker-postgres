#!/bin/sh
aws s3 cp $1 "s3://$PG_BACKUP_STORAGE_S3_BUCKET/wal/$2"
