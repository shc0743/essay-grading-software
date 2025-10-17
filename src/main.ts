import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'
import DialogView from 'vue-dialog-view';
import { AGREEMENT_VERSION, app_name_id } from './config';
import { db } from './userdata.ts'

if (await db.get('config', 'agreement.version') !== AGREEMENT_VERSION) {
    location.href = 'agreement.html';
    await new Promise(() => { }); // Prevent further execution
}

const app = createApp(App)

app.config.globalProperties.app_name = app_name_id;

app.use(router)
app.use(DialogView);

import ActivityView from './components/ActivityView.vue'
import ActivityBody from './components/ActivityBody.vue'
import ActivityTitle from './components/ActivityTitle.vue'
app.component('ActivityView', ActivityView)
app.component('ActivityBody', ActivityBody)
app.component('ActivityTitle', ActivityTitle)

app.mount('vue-app')
