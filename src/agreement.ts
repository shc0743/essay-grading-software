import { createApp } from "vue";
import LicenseViewApp from "./LicenseViewApp.vue";
import { db } from "./userdata.ts";
import { AGREEMENT_VERSION } from "./config.ts";

if (await db.get("config", "agreement.version") === AGREEMENT_VERSION && location.search !== '?view') {
    location.href = "./";
    await new Promise(() => {}); // Prevent further execution
}

const app = createApp(LicenseViewApp)

app.mount("license-view");

