/* eslint-disable no-console */
import { SpawnOptionsWithoutStdio, spawn } from "node:child_process";

import { color } from "console-log-colors";
import Mask from "./mask.js";

export const spawnPromise = (path, args?: (string | Mask)[], options?: SpawnOptionsWithoutStdio & { logCommand?: boolean, logData?: boolean, logError?: boolean, throwOnFail?: boolean }) => new Promise<{
    get all(): string;
    pid: number;
    status: number;
}>((resolve, reject) => {
    const all = [];
    const { logCommand = true, throwOnFail = true, logData = true, logError = true } = options ??= {};
    options.timeout ??= 5*60*1000;
    const cd = spawn(path, args?.map((x: any) => x instanceof Mask ? x.value : x), options);
    const pid = cd.pid;

    const clear = () => {
        try {
            cd.stderr.removeAllListeners();
            cd.stdout.removeAllListeners();
            cd.removeAllListeners();
        } catch {
            // do nothing...
        }
    };

    cd.stdout.on("data", (data) => {
        data = data.toString("utf-8");
        all.push(data);
    });
    cd.stderr.on("data", (data) => {
        data = data.toString("utf-8");
        all.push(color.red(data));
    });

    cd.on("error", (error) => {
        const errorText = color.red(error.stack ?? error.toString());
        all.push(error.stack ?? error.toString());
        if (logData || logError) {
            console.error(errorText);
        }
        reject(error);
    });
    cd.on("close", (status) => {
        if (status>0) {
            if (logError) {
                console.error(all);
            }
            if (throwOnFail) {
                clear();
                reject(new Error(all.join("\n")));
                return;
            }
        }
        if (logCommand) {
            console.log(`Spawn: ${path} ${JSON.stringify(args, undefined, 2)}`);
            if (logData) {
                console.log(all.join("\n"));
            }
        }
        clear();
        resolve({
            get all() {
                return all.join("\n");
            },
            pid,
            status });
    });
});
