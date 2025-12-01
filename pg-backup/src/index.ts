import { promises } from "timers";
import { Backup } from "./Backup.js";

const oneMinute = 60*1000;
const interval = oneMinute * 15;

(async function() {

    await promises.setTimeout(5*1000);

    let retries = 0;

    let lastFolder;

    for(;;) {

        try {
            const [folder, time] = (new Date()).toJSON().replaceAll(":", "-").replace("T", "/").split("/");
            if (lastFolder && lastFolder !== folder) {
                // crc64 breaks after 24 hours so we should exit and let docker restart the process again.
                process.exit(0);
                return;
            }
            lastFolder = folder;

            const uploader = new Backup(folder, time);
            await uploader.upload();
            retries = 0;
        } catch (error) {
            console.error(error);
            if (retries > 2) {
                throw error;
            }
            await promises.setTimeout(5*1000);
            retries++;
            continue;
        }
        await promises.setTimeout(interval);

    }
})().catch((error) => {
    console.error(error);
    process.exit(1);
});