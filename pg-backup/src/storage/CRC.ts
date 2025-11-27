import { createReadStream } from "node:fs";
import { CrtCrc64Nvme } from "@aws-sdk/crc64-nvme-crt";

const CRC = {
    async CRC64NVME(filePath: string ) {
        const crc = new CrtCrc64Nvme();
        const reader = createReadStream(filePath);
        for await(const buffer of reader) {
            crc.update(buffer);
        }
        const hash = await crc.digest();
        return Buffer.from(hash).toString("base64");

    }
};

export default CRC;
