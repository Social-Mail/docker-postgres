import { createReadStream } from "node:fs";
import { CrtCrc64Nvme } from "@aws-sdk/crc64-nvme-crt";

const CRC = {
    async CRC64NVME({ filePath, buffer } : { filePath: string, buffer?: never } | { filePath?: never, buffer: Buffer}) {
        const crc = new CrtCrc64Nvme();
        if (filePath) {
            const reader = createReadStream(filePath);
            for await(const buf of reader) {
                crc.update(buf);
            }
        } else {
            crc.update(buffer);
        }
        const hash = await crc.digest();
        return Buffer.from(hash).toString("base64");
    }
};

export default CRC;
