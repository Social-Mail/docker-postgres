import { join } from "path";
import S3Storage from "./storage/S3Storage.js";
import { globalEnv } from "./globalEnv.js";
import { existsSync } from "fs";
import { spawnPromise } from "./spawnPromise.js";

export class Uploader {

    storage = new S3Storage();

    backupFolder: string;
    timeFolder: string;

    constructor(public folder: string, public time: string ) {
        this.backupFolder = join(globalEnv.folders.backup, folder);
        this.timeFolder = join(this.backupFolder, time);
    }

    async upload() {

        await this.uploadFullBackup();

        await this.uploadDifference();

        await this.uploadArchives();
    }

    async uploadFullBackup() {

        const fullBackupName = join(this.backupFolder, "base.tar");

        // check if storage exists..
        if (!existsSync(fullBackupName)) {
            // lets us create a backup...

            const tempBackupFolder = this.backupFolder + "." + Date();

            const { status } = await spawnPromise("pg_basebackup", ["-D", tempBackupFolder, "-f t", "-R"]);

            if (status) {
                throw new Error("backup failed");
            }
            // after success
            await spawnPromise("mv", [tempBackupFolder, this.backupFolder]);
        }

    }

    async uploadDifference() {
    }

    async uploadArchives() {
    }

}