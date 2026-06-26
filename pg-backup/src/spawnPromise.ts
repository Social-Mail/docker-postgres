/* eslint-disable no-console */
import { SpawnOptionsWithoutStdio, spawn } from "node:child_process";

import { color } from "console-log-colors";
import Mask from "./mask.js";

export const spawnPromise = (path, args?: (string | Mask)[], options?: SpawnOptionsWithoutStdio & { streamLog?: boolean | ((...a: any) => void), logCommand?: boolean, logData?: boolean, logError?: boolean, throwOnFail?: boolean }) => new Promise<{
    get all(): string;
    pid: number;
    status: number;
}>((resolve, reject) => {
    const all = [];
    const { logCommand = true, throwOnFail = true, logData = true, logError = true } = options ??= {};
    let { streamLog } = options;
    if (typeof streamLog === "boolean") {
        streamLog = streamLog ? console.log : void 0;
    } else {
        streamLog = console.log;
    }
    // full one hour timeout
    const ac = new AbortController();
    const timer = setTimeout(() => {
        ac.abort("timedout");
    }, 15*60*1000);
    options.signal = ac.signal;

    if(logCommand || streamLog) {
        console.log(`${path} ${args.map((x) => x.toString()).map((x) => /\s/.test(x) ? JSON.stringify(x) : x).join(" ")}`);
    }

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
        timer.refresh();
        data = data.toString("utf-8");
        streamLog?.(data);
        all.push(data);
    });
    cd.stderr.on("data", (data) => {
        timer.refresh();
        data = data.toString("utf-8");
        streamLog?.(data);
        all.push(color.red(data));
    });

    cd.on("error", (error) => {
        timer.close();
        const errorText = color.red(error.stack ?? error.toString());
        all.push(error.stack ?? error.toString());
        if (logData || logError) {
            console.error(errorText);
        }
        reject(error);
    });
    cd.on("close", (status) => {
        timer.close();
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
