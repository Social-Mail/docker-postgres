import { opendir } from "node:fs/promises";
import { join, relative } from "node:path";

export default abstract class BaseStorage {
    abstract download(a: {cloudPath: string, localPath: string}): Promise<void>;
    abstract upload(a: { cloudPath: string, localPath: string }): Promise<void>;

    abstract getConfig(): Promise<any>;
    abstract saveConfig(config: any): Promise<void>;

    abstract exists(cloudPath, localPath): Promise<boolean>;

    abstract list(cloudPath, signal?: AbortSignal, throwIfAborted?: boolean): AsyncGenerator<{ cloudPath: string }>;

    async sync({ cloudPath, localPath }) {

        using ds = await opendir(localPath, { recursive: true });

        for await(const child of ds) {
            if (child.isDirectory()) {
                continue;
            }

            // we should only upload .enc files
            if (!child.name.endsWith(".enc")) {
                continue;
            }

            const filePath = join(child.parentPath, child.name);
            const relativePath = relative(localPath, filePath );
            const destination = join(cloudPath, relativePath);
            if (await this.exists(destination, filePath)) {
                continue;
            }
            await this.upload({ cloudPath: destination, localPath: filePath});
        }
        
    }
    
}