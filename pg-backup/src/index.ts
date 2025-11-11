import { promises } from "timers";
import { Uploader } from "./Uploader.js";

const oneMinute = 60*60*1000;
const interval = oneMinute * 15;

(async function() {
for(;;) {

    const [folder, time] = (new Date()).toJSON().replaceAll(":", "-").replace("T", "/").split("/");

    const uploader = new Uploader(folder, time);
    await uploader.upload();
    await promises.setTimeout(interval);

}
})().catch(console.error);