import { opendir } from "node:fs/promises";
import { join, relative } from "node:path";
import Hash from "./Hash.js";

export default abstract class BaseStorage {
    abstract download(a: {cloudPath: string, localPath: string}): Promise<void>;
    abstract upload(a: { cloudPath: string, localPath: string }): Promise<void>;

    abstract exists(cloudPath, sha256): Promise<boolean>;

    async sync({ cloudPath, localPath }) {

        using ds = await opendir(localPath, { recursive: true });

        for await(const child of ds) {
            if (child.isDirectory()) {
                continue;
            }

            const filePath = join(child.parentPath, child.name);
            const relativePath = relative(localPath, filePath );
            const destination = join(cloudPath, relativePath);
            const hash = await Hash.hash(filePath);
            if (await this.exists(destination, hash)) {
                continue;
            }
            await this.upload({ cloudPath: destination, localPath: filePath});
        }
        
    }
    
}