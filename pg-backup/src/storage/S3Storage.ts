import { writeFile } from "node:fs/promises";
import { globalEnv } from "../globalEnv.js";
import BaseStorage from "./BaseStorage.js";
import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
import Hash from "./Hash.js";
import { createReadStream } from "node:fs";
import { join } from "node:path";

export default class S3Storage extends BaseStorage {

    client: S3Client;
    bucket: string;
    prefix: string;
    folder: string;

    constructor() {
        super();
        const { endpoint, accessKeyId, secretAccessKey, region, bucket, folder } = globalEnv.storage.s3;
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

    async download({ cloudPath, localPath }): Promise<void> {
        const Key = join(this.folder, cloudPath);
        const r = await this.client.send(new GetObjectCommand({
            Bucket: this.bucket,
            Key
        }));
        await writeFile(localPath, r.Body as Readable);
    }

    async upload({ cloudPath, localPath }) {
        const Key = join(this.folder, cloudPath);
        const ChecksumSHA256 = await Hash.hash(localPath);

        console.log(`Uploading ${localPath} to ${cloudPath}`);

        await this.client.send(new PutObjectCommand({
            Bucket: this.bucket,
            Key,
            ChecksumSHA256,
            Body: createReadStream(localPath)
        }));
    }

    async exists(cloudPath, hash: string) {
      const Key = join(this.folder, cloudPath);
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        ChecksumMode:"ENABLED",
        Key,
      });

      try {
        const result = await this.client.send(command);
        if(result.ChecksumSHA256 === hash) {
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