import { writeFile } from "node:fs/promises";
import { globalEnv } from "../globalEnv.js";
import BaseStorage from "./BaseStorage.js";
import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
import Hash from "./Hash.js";
import { createReadStream } from "node:fs";

export default class S3Storage extends BaseStorage {

    client: S3Client;
    bucket: string;

    constructor() {
        super();
        const { endpoint, accessKeyId, secretAccessKey, region, bucket } = globalEnv.storage.s3;
        this.bucket = bucket;
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

    async download({ uploadPath, localFile }): Promise<void> {
        const r = await this.client.send(new GetObjectCommand({
            Bucket: this.bucket,
            Key: uploadPath
        }));
        await writeFile(localFile, r.Body as Readable);
    }

    async upload({ uploadPath, localFile }) {
        const ChecksumSHA256 = await Hash.hash(localFile);

        await this.client.send(new PutObjectCommand({
            Bucket: this.bucket,
            Key: uploadPath,
            ChecksumSHA256,
            Body: createReadStream(localFile)
        }));
    }

    async exists({ uploadPath }) {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: uploadPath,
      });

      try {
        await this.client.send(command);
        return true; // File exists
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