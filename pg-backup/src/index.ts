import { promises } from "timers";
import { Uploader } from "./Uploader.js";

const oneMinute = 60*60*1000;
const interval = oneMinute * 15;

(async function() {

    await promises.setTimeout(5*1000);

    for(;;) {

        try {
            const [folder, time] = (new Date()).toJSON().replaceAll(":", "-").replace("T", "/").split("/");

            const uploader = new Uploader(folder, time);
            await uploader.upload();
        } catch (error) {
            console.error(error);
            await promises.setTimeout(15*1000);
            continue;
        }
        await promises.setTimeout(interval);
        

    }
})().catch(console.error);