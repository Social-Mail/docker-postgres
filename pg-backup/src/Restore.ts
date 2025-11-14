import { dirname, join, relative } from "node:path";
import S3Storage from "./storage/S3Storage.js"
// import { promises } from "node:timers";
import { spawnPromise } from "./spawnPromise.js";
import { mkdir, opendir, readdir, unlink, writeFile } from "node:fs/promises";
import { globalEnv } from "./globalEnv.js";
import { existsSync } from "node:fs";

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
        }

        const pgRestore = globalEnv.folders.restore;



        await spawnPromise("mkdir", ["-p", dirname(pgRestore)]);

        const folders = await readdir(tmpRoot, { withFileTypes: true });
        for(const { name, parentPath } of folders) {
            const source = join(parentPath, name);
            const relativeFolder = relative(tmpRoot, source);
            const dest = join(pgRestore, relativeFolder);
            await spawnPromise("mv", [ source, dest])
        }

        folders.length = 0;

        using ds = await opendir(pgRestore, { recursive: true });
        for await(const d of ds) {
            if (d.isDirectory()) {
                const manifest = join(d.parentPath, d.name, "backup_manifest");
                console.log(`Checking ${manifest}`);
                if (existsSync(manifest)) {
                    folders.push(d);
                }
            }
        }

        await writeFile(join(pgRestore, "restore.sh"), `#!/bin/sh
pg_combinebackup -o ${pgRestore} ${folders.join(" ")}
`);

        await spawnPromise("chmod", ["+x", join(pgRestore, "restore.sh")]);


    }
}