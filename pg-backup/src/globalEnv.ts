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
    source: {
        host: process.env.PG_BACKUP_HOST,
        port: process.env.PG_BACKUP_PORT,
        socket: process.env.PG_BACKUP_SOCKET || "/var/run/postgresql",
        user: process.env.PG_BACKUP_USER || "postgres",
        password: process.env.POSTGRES_PASSWORD
    },
    folders: {
        backup: process.env.PG_BACKUP_FOLDER || "/cache"
    }
};