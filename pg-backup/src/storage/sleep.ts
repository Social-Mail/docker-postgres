export default function sleep(ms: number, signal?: AbortSignal) {
    if (signal?.aborted) {
        return 1;
    }
    return new Promise<void>((resolve, reject) => {
        const id = setTimeout(resolve, ms);
        signal?.addEventListener("abort", () => {
            clearTimeout(id);
            resolve();
        });
    });
}