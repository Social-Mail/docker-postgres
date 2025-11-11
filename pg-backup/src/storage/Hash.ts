import crypto, { BinaryToTextEncoding } from "node:crypto";
import { createReadStream } from "node:fs";
export default class Hash {

    static async hash(localFile: string, encode: BinaryToTextEncoding = "base64") {
        const sha256 = crypto.createHash("sha256");
        const stream = createReadStream(localFile);
         return new Promise<string>((resolve, reject) => {
                stream.on("end", () => {
                    sha256.end(() => {
                        resolve(sha256.digest(encode));
                    });
                });
                stream.pipe(sha256);
            });
    }

}