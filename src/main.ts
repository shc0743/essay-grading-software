import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'
import DialogView from 'vue-dialog-view';
import { AGREEMENT_VERSION, app_name_id, PROMPT_FILES } from './config';
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

// 初始化提示词列表
import { fs } from './userdata.ts'
if (!await fs.exists('prompts')) {
    await fs.mkdir('prompts');
}
const loadPrompt = async (name: string, version: number) => {
    if (await fs.exists(`prompts/${name}.txt`)) { // fs中直接保存最新版，方便使用
        return;
    }
    const response = await fetch(`/prompts/${name}@${version}.txt`);
    const text = await response.text();
    await fs.writeFile(`prompts/${name}.txt`, text);
}
for (const i in PROMPT_FILES) await loadPrompt(i, PROMPT_FILES[i]);


app.mount('vue-app')