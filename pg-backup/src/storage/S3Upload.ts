import { CompleteMultipartUploadCommand, CreateMultipartUploadCommand, CreateMultipartUploadCommandOutput, S3Client, UploadPartCommand } from "@aws-sdk/client-s3";
import TaskManager from "./TaskManager.js";
import LocalFile from "./LocalFile.js";
import CRC from "./CRC.js";

export default class S3Upload {

    public readonly filePath: string;
    public readonly Bucket: string;
    public readonly Key: string;
    private ChecksumCRC64NVME: string;
    public readonly ChecksumAlgorithm = "CRC64NVME";
    public readonly ChecksumType = "FULL_OBJECT";

    tm: TaskManager;
    encryption: any;

    constructor(
        private client: S3Client,
        { filePath, Bucket, Key, encryption = {} }
    ) {
        this.filePath = filePath;
        this.Bucket = Bucket;
        this.Key = Key;
        this.encryption = encryption;

        this.tm = new TaskManager();
    }

    async upload() {

        this.ChecksumCRC64NVME = await CRC.CRC64NVME({ filePath: this.filePath });

        const uploadRequest = await this.client.send(new CreateMultipartUploadCommand({
            Bucket: this.Bucket,
            Key: this.Key,
            ChecksumType: "FULL_OBJECT",
            ChecksumAlgorithm: "CRC64NVME",
            ... this.encryption
        }));

        const localFile = new LocalFile(this.filePath);


        const BlockSize = 64*1024*1024;

        const all = [];

        let i = 0;

        let sent = 0;
        const total = localFile.contentSize;

        for await(const buffer of localFile.readBuffers(BlockSize)) {
            const partNumber = ++i;
            all.push(await this.tm.queueRun(() => this.uploadBlock(partNumber, uploadRequest, buffer)));
            sent += buffer.length;
            if (sent < total) {
                console.log(`Uploading... ${this.filePath} to ${this.Key} progress ${(sent*100/total).toFixed(2)}%`)
            }
        }

        const Parts = await Promise.all(all);

        await this.client.send(new CompleteMultipartUploadCommand({
            Bucket: this.Bucket,
            Key: this.Key,
            UploadId: uploadRequest.UploadId,
            ChecksumCRC64NVME: this.ChecksumCRC64NVME,
            ChecksumType: this.ChecksumType,
            ... this.encryption,
            MultipartUpload: {
                Parts
            }
        }));

        console.log(`Uploaded ${this.filePath} to ${this.Key} with checksum ${this.ChecksumCRC64NVME}`)
    }

    async uploadBlock(PartNumber: number, uploadRequest: CreateMultipartUploadCommandOutput, buffer: Buffer<ArrayBuffer>) {

        const ChecksumCRC64NVME = await CRC.CRC64NVME({ buffer });

        const r = await this.client.send(new UploadPartCommand({
            Bucket: this.Bucket,
            Key: this.Key,
            PartNumber,
            UploadId: uploadRequest.UploadId,
            ChecksumAlgorithm: this.ChecksumAlgorithm,
            ChecksumCRC64NVME,
            Body: buffer,
            ... this.encryption
        }));
        return {
            ETag: r.ETag,
            PartNumber,
            ChecksumCRC64NVME
        };
    }


    

}