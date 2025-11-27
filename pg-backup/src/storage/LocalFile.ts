import { statSync } from "node:fs";
import { open } from "node:fs/promises";

export default class LocalFile {

    contentSize: number;

    constructor(public readonly path: string) {
        this.contentSize = statSync(path).size;
    }

    public async *readBuffers(bufferSize = 16 * 1024 * 1024, signal?: AbortSignal) {
        const size = this.contentSize;
        let buffer = Buffer.alloc(bufferSize);
        for (let offset = 0; offset < size; offset += bufferSize) {
            const length = ((offset + bufferSize) > size )
                ? (size - offset)
                : bufferSize;
            let fd = await open(this.path);
            try {
                if (signal?.aborted) {
                    throw new Error("aborted");
                }
                if (buffer.length !== length) {
                    buffer = Buffer.alloc(length);
                }
                await fd.read({ position: offset, length, buffer });
                await fd.close();
                fd = null;
                yield buffer;
            } finally {
                if (fd) {
                    await fd.close();
                }
            }
        }
    }
}