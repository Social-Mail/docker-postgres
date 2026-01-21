import { join } from "path";
import S3Storage from "./storage/S3Storage.js";
import { globalEnv } from "./globalEnv.js";
import { existsSync } from "fs";
import { spawnPromise } from "./spawnPromise.js";
import { mkdir, opendir, readdir } from "fs/promises";
import Encryption from "./Encryption.js";

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

        const fullBackupName = join(folder, "base.tar.gz.enc");

        // check if storage exists..
        if (!existsSync(fullBackupName)) {
            // lets us create a backup...

            const tempBackupFolder = "/tmp/pg-backup-" + Date.now();

            await mkdir(tempBackupFolder, { recursive: true });

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
                const times = await readdir(this.backupFolder, { withFileTypes: true });
                times.sort((a, b) => a.name.localeCompare(b.name));
                let manifest = join(this.backupFolder, "backup_manifest");
                for (const time of times) {
                    const lastManifest = join(time.parentPath, time.name, "backup_manifest");
                    if (existsSync(lastManifest)) {
                        manifest = lastManifest;
                    }
                }
                args.push("-i", manifest );
            } else {
                args.push("-R");

                // as we are going to run differential backup
                // immediately, there is no need to stream and hold the backup process
                args.push("-X", "n");
            }

            const { status } = await spawnPromise(
                "/usr/bin/pg_basebackup", args , {
                        env: {
                            PGPASSWORD: globalEnv.source.password
                        }
                    });

            if (status) {
                try {
                    await spawnPromise("rm", ["-rf", tempBackupFolder]);
                } catch (error) {
                    console.error(error);
                }
                throw new Error("backup failed");
            }

            // check if manifest was generated...
            if(!existsSync(join(tempBackupFolder, "backup_manifest"))) {
                try {
                    await spawnPromise("rm", ["-rf", tempBackupFolder]);
                } catch (error) {
                    console.error(error);
                }
                throw new Error("backup failed");
            }

            // encrypt every file here...
            console.log(`Encrypting files`);

            for(const file of await readdir(tempBackupFolder, { recursive: true, withFileTypes: true })) {
                if (file.isDirectory()) {
                    continue;
                }
                const deleteFile = file.name !== "backup_manifest";
                await Encryption.encryptFile(join(file.parentPath, file.name), deleteFile);
            }

            // after success
            await spawnPromise("mv", [tempBackupFolder, folder]);
        }

        console.log(`${type} backup exists at ${folder}`);

    }

}