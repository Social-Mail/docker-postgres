import { existsSync } from "fs";
import { readdir, rm, unlink } from "fs/promises";
import { join } from "path";

export default class FileHelper {

    static async clearFolder(folder) {
        const all = await readdir(folder, { recursive: true, withFileTypes: true });
        const folders = [];
        for (const file of all) {
            if (!file.isDirectory()) {
                await unlink(join(file.parentPath, file.name));
                continue;
            }
            folders.push(join(file.parentPath, file.name));
        }

        for (const folder of folders) {
            if (existsSync(folder)) {
                await rm(folder, { maxRetries: 10, retryDelay: 100, force: true, recursive: true });
            }
        }

    }

}