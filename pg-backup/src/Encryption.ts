import { mkdir, unlink, writeFile } from "fs/promises";
import { spawnPromise } from "./spawnPromise.js";
import { dirname } from "path";
import { existsSync } from "fs";

export default class Encryption {

    static async encryptFile(filePath: string, deleteFile = true) {

        const encPath = `${filePath}.enc`;
        await spawnPromise("openssl", ["enc", "-aes-256-cbc", "-pbkdf2", "-in", filePath, "-out", encPath, "-pass", "file:/app/.pwd-hash" ]);
        if (!deleteFile) {
            return;
        }
        await unlink(filePath);
    }


    static async decryptFile(filePath: string, body) {

        const encPath = `/tmp${filePath}.enc`;
        const dir = dirname(encPath);
        if (!existsSync(dir)) {
            await mkdir(dir, { recursive: true });
        }
        await writeFile(encPath, body);
        await spawnPromise("openssl", ["enc", "-d", "-aes-256-cbc", "-pbkdf2", "-in", encPath, "-out", filePath, "-pass", "file:/app/.pwd-hash" ]);
        await unlink(encPath);
    }

}