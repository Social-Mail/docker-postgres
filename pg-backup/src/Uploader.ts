import { join } from "path";
import S3Storage from "./storage/S3Storage.js";
import { globalEnv } from "./globalEnv.js";
import { existsSync } from "fs";
import { spawnPromise } from "./spawnPromise.js";
import { opendir } from "fs/promises";

export class Uploader {

    storage = new S3Storage();

    backupFolder: string;
    timeFolder: string;

    constructor(public folder: string, public time: string ) {
        this.backupFolder = join(globalEnv.folders.backup, folder);
        this.timeFolder = join(this.backupFolder, time);
    }

    async upload() {

        await this.takeBackup(this.backupFolder);

        await this.takeBackup(this.timeFolder, true);

        // upload all files...
        await this.storage.sync({ cloudPath: this.folder, localPath: this.backupFolder });

        await this.cleanUp();

    }

    async cleanUp() {
        for(;;) {
            let processed = false;
            const ds = await opendir(globalEnv.folders.backup);
            for await (const dir of ds) {
                if(dir.isDirectory()) {
                    const current = join(dir.parentPath, dir.name);
                    if (current === this.backupFolder) {
                        break;
                    }
                    processed = true;
                    {
                        using _d = ds;
                        await this.storage.sync({ cloudPath: dir.name, localPath: current });
                    }
                    await spawnPromise("rm", ["-rf", current]);
                    break;
                }
            }
            if(!processed) {
                break;
            }
        }
    }

    async takeBackup(folder: string, diff = false) {

        const type = diff ? "diff" : "full";

        const fullBackupName = join(folder, "base.tar.gz");

        // check if storage exists..
        if (!existsSync(fullBackupName)) {
            // lets us create a backup...

            const tempBackupFolder = folder + "." + Date.now();

            console.log(`Taking ${type} backup at ${tempBackupFolder}`);

            const args = [
                    "-h", globalEnv.source.socket ,
                    "-D", tempBackupFolder,
                    "-U", globalEnv.source.user,
                    "-w",
                    "-F", "t",
                    "-z",
                    "-R"];

            if (diff) {

                // find last backup_manifest...
                let lastDir = this.backupFolder;
                using ds = await opendir(this.backupFolder);
                for await (const dir of ds) {
                    if(dir.isDirectory()) {
                        lastDir = join(dir.parentPath, dir.name);
                    }
                }

                args.push("-i", join(lastDir, "backup_manifest") );
            }

            const { status } = await spawnPromise(
                "/usr/bin/pg_basebackup", args , {
                        env: {
                            PGPASSWORD: globalEnv.source.password
                        }
                    });

            if (status) {
                throw new Error("backup failed");
            }
            // after success
            await spawnPromise("mv", [tempBackupFolder, folder]);
        }

        console.log(`${type} backup exists at ${folder}`);

    }

}