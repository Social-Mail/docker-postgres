import { join } from "path";
import S3Storage from "./storage/S3Storage.js";
import { globalEnv } from "./globalEnv.js";
import { existsSync } from "fs";
import { spawnPromise } from "./spawnPromise.js";
import { opendir } from "fs/promises";

export class Backup {

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
            let current = void 0;
            const ds = await opendir(globalEnv.folders.backup);
            for await (const dir of ds) {
                if(dir.isDirectory()) {
                    current = join(dir.parentPath, dir.name);
                    if (current !== this.backupFolder) {
                        await this.storage.sync({ cloudPath: dir.name, localPath: current });
                    } else {
                        current = void 0;
                    }
                    break;
                }
            }
            if (current) {
                await spawnPromise("rm", ["-rf", current]);
                continue;
            }
            break;
        }
    }

    async takeBackup(folder: string, diff = false) {

        const type = diff ? "diff" : "full";

        const fullBackupName = join(folder, "base.tar.gz");

        // check if storage exists..
        if (!existsSync(fullBackupName)) {
            // lets us create a backup...

            const tempBackupFolder = folder + "." + Date.now();

            const latest = await this.storage.getConfig();

            // write latest as this one...
            await this.storage.saveConfig({ latest: this.folder, time: this.time });

            console.log(`Taking ${type} backup at ${tempBackupFolder}`);

            const args = [
                    "-h", globalEnv.source.socket ,
                    "-D", tempBackupFolder,
                    "-U", globalEnv.source.user,
                    "-w",
                    "-F", "t",
                    "-z"];

            if (diff) {

                if (!latest.time) {
                    throw new Error("storage does not contain last config");
                }

                // find last backup_manifest...
                let lastDir = join(this.backupFolder, latest.time);
                args.push("-i", join(lastDir, "backup_manifest") );
            } else {
                args.push("-R");
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