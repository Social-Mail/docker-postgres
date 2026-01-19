import { mkdir } from "node:fs/promises";
import { globalEnv } from "../globalEnv.js";
import BaseStorage from "./BaseStorage.js";
import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import CRC from "./CRC.js";
import S3Upload from "./S3Upload.js";
import { spawnSync } from "node:child_process";
import Encryption from "../Encryption.js";

export default class S3Storage extends BaseStorage {

    client: S3Client;
    bucket: string;
    prefix: string;
    folder: string;

    constructor() {
        super();
        const { endpoint, accessKeyId, secretAccessKey, region, bucket, folder } = globalEnv.storage.s3;

        spawnSync("/app/hash-pwd.sh");

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
            Bucket: this.bucket,
            Key,
            Body
        }));
    }

    async download({ cloudPath, localPath }): Promise<void> {
        const Key = join(this.folder, cloudPath);
        console.log(`Downloading ${cloudPath} to ${localPath}`);
        const r = await this.client.send(new GetObjectCommand({
            Bucket: this.bucket,
            Key,
        }));
        const dir = dirname(localPath);
        if (!existsSync(dir)) {
            await mkdir(dir, { recursive: true });
        }
        await Encryption.decryptFile(localPath, r.Body as Readable);
    }

    async upload({ cloudPath, localPath }) {
        const Key = join(this.folder, cloudPath);

        const uploadRequest = new S3Upload(
            this.client,
            {
                Bucket: this.bucket,
                Key,
                filePath: localPath
            }
        );
        await uploadRequest.upload();
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

    async exists(cloudPath, localPath) {
        const Key = join(this.folder, cloudPath);
        const command = new HeadObjectCommand({
            Bucket: this.bucket,
            ChecksumMode: "ENABLED",
            Key,
        });

        try {
            const ChecksumCRC64NVME = await CRC.CRC64NVME({ filePath: localPath });
            const result = await this.client.send(command);
            if(result.ChecksumCRC64NVME === ChecksumCRC64NVME) {
                return true;
            }
            console.log(`Checksome didn't match ${ChecksumCRC64NVME} !== ${result.ChecksumCRC64NVME}`);
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