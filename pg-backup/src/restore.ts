import { join } from "node:path";
import S3Storage from "./storage/S3Storage.js"

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
        const tmpRoot = join("/tmp/backups", folder);

        // download everything...
        for await(const { cloudPath } of this.storage.list(folder)) {
            const localPath = join(tmpRoot, cloudPath);
            await this.storage.download({ cloudPath, localPath });
        }
    }
}