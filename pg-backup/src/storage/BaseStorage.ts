export default abstract class BaseStorage {
    abstract download(a: {localFile: string, uploadPath: string}): Promise<void>;
    abstract upload(a: { localFile: string, uploadPath: string }): Promise<void>;
}