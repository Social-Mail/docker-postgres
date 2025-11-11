export const globalEnv = {

    storage: {
        s3: {
            accessKeyId: process.env.PG_BACKUP_STORAGE_S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.PG_BACKUP_STORAGE_S3_SECRET,
            region: process.env.PG_BACKUP_STORAGE_S3_REGION,
            bucket: process.env.PG_BACKUP_STORAGE_S3_BUCKET,
            endpoint: process.env.PG_BACKUP_STORAGE_S3_ENDPOINT
        },
    },

    folders: {
        backup: process.env.PG_BACKUP_FOLDER
    }
};