import { mkdir, stat, writeFile } from "node:fs/promises";
import { globalEnv } from "../globalEnv.js";
import BaseStorage from "./BaseStorage.js";
import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand, ListObjectsV2Command, CreateMultipartUploadCommand, UploadPartCommandInput, UploadPartCommand } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
import { Upload } from "@aws-sdk/lib-storage";
import Hash from "./Hash.js";
import * as crypto from "node:crypto";
import { createReadStream, existsSync } from "node:fs";
import { dirname, join } from "node:path";

export default class S3Storage extends BaseStorage {

    client: S3Client;
    bucket: string;
    prefix: string;
    folder: string;

    encryption: { SSECustomerKey: string; SSECustomerAlgorithm: string; SSECustomerKeyMD5: string; };

    constructor() {
        super();
        const { endpoint, accessKeyId, secretAccessKey, region, bucket, folder, encryptionPassword } = globalEnv.storage.s3;

        const keyBuffer = crypto.createHash("sha256")
            .update(encryptionPassword)
            .digest();

        const SSECustomerKey = keyBuffer.toString("base64");
        const SSECustomerAlgorithm = "AES256";
        const SSECustomerKeyMD5 = crypto.createHash("md5").update(keyBuffer).digest("base64");

        this.encryption = { SSECustomerKey, SSECustomerAlgorithm, SSECustomerKeyMD5 };

        this.bucket = bucket;
        this.folder = folder;
        this.client = new S3Client({
            endpoint,
            credentials: {
                accessKeyId,
                secretAccessKey
            },
            forcePathStyle: endpoint ? true : false,
            region,
        });
    }

    async getConfig() {
        const Key = join(this.folder, "config.json");
        try {
            
            const r = await this.client.send(new GetObjectCommand({
                ... this.encryption,
                Bucket: this.bucket,
                Key
            }));
            return JSON.parse(await r.Body.transformToString());
        } catch (error) {
             if (error.name === 'NotFound') {
                return {}; // File does not exist
            }
            console.error(`Failed to download config from ${Key}`);
            console.error(error);
            return {};
        }
    }

    async saveConfig(config: any): Promise<void> {
        const Key = join(this.folder, "config.json");
        const Body = JSON.stringify(config);
        console.log(`Saving config ${Body} at ${Key}`);

        await this.client.send(new PutObjectCommand({
            ... this.encryption,
            Bucket: this.bucket,
            Key,
            Body
        }));
    }

    async download({ cloudPath, localPath }): Promise<void> {
        const Key = join(this.folder, cloudPath);
        console.log(`Downloading ${cloudPath} to ${localPath}`);
        const r = await this.client.send(new GetObjectCommand({
            ... this.encryption,
            Bucket: this.bucket,
            Key,
        }));
        const dir = dirname(localPath);
        if (!existsSync(dir)) {
            await mkdir(dir, { recursive: true });
        }
        await writeFile(localPath, r.Body as Readable);
    }

    async upload({ cloudPath, localPath }) {
        const Key = join(this.folder, cloudPath);

        const uploadRequest = new Upload({
            client: this.client,
            params: {
                Bucket: this.bucket,
                Key,
                ... this.encryption,
                Body: createReadStream(localPath)
            },
            queueSize: 4,
            partSize: 1024*1024*128,
            leavePartsOnError: false
        });
        uploadRequest.on("httpUploadProgress", (progress) => {
            console.log(progress);
        });
        await uploadRequest.done();
    }

    async *list(cloudPath, signal?: AbortSignal, throwIfAborted = false) {
        const Prefix = join(this.folder, cloudPath);
        let ContinuationToken = void 0;
        for (; ;) {
            if (signal?.aborted) {
                if (throwIfAborted) {
                    signal.throwIfAborted();
                }
                break;
            }
            const command = new ListObjectsV2Command({
                Bucket: this.bucket,
                Prefix,
                ContinuationToken,
            });
            const result = await this.client.send(command);
            for (const { Key } of result.Contents) {
                yield {
                    cloudPath: Key.substring(this.folder.length + 1),
                };
            }
            if (result.NextContinuationToken) {
                ContinuationToken = result.NextContinuationToken;
            }
            break;
        }

    }

    async exists(cloudPath, hash: string) {
        const Key = join(this.folder, cloudPath);
        const command = new HeadObjectCommand({
            Bucket: this.bucket,
            ... this.encryption,
            ChecksumMode: "ENABLED",
            Key,
        });

        try {
            const result = await this.client.send(command);
            if (result.ChecksumSHA256 === hash) {
                return true; // File exists
            }
            return false;
        } catch (error) {
            if (error.name === 'NotFound') {
                return false; // File does not exist
            }
            // Handle other potential errors (e.g., permissions, network issues)
            console.error("Error checking file existence:", error);
            throw error;
        }
    }

}