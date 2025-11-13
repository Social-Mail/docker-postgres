import { dirname, join } from "node:path";
import S3Storage from "./storage/S3Storage.js"
// import { promises } from "node:timers";
import { spawnPromise } from "./spawnPromise.js";
import { mkdir, unlink } from "node:fs/promises";

export default class Restore {

    storage = new S3Storage();

    constructor() {

    }

    async restore() {
        const folder = process.env.PG_RESTORE_DAY || (await this.storage.getConfig()).latest;
        if(!folder) {
            throw new Error("No latest backup exist");
        }

        // load all into a temp folder...
        const tmpRoot = "/tmp/backups/" + Date.now();

        const manifests = [];

        // download everything...
        for await(const { cloudPath } of this.storage.list(folder)) {
            const localPath = join(tmpRoot, cloudPath);
            await this.storage.download({ cloudPath, localPath });
            if (localPath.endsWith(".tar.gz")) {
                const localFolder = dirname(localPath);
                await mkdir(localFolder, { recursive: true });
                await spawnPromise("tar", ["-xvzf", localPath, "-C", localFolder]);
                await unlink(localPath);
            }
            if(localPath.endsWith("backup_manifest")) {
                manifests.push(dirname(localPath));
            }
        }




    }
}