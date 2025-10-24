import { createApp, h } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'
import DialogView from 'vue-dialog-view';
import { AGREEMENT_VERSION, app_name_id, PROMPT_FILES } from './config';
import { db } from './userdata.ts'
import { ElPopMessage as ElMessage } from 'el-message-in-popover'
import { ElMessageBox } from 'element-plus';

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
async function init_prompts() {
    const version = await db.get('config', 'prompt.version.lock');
    const latest = JSON.stringify(PROMPT_FILES);
    if (version === latest) return;
    const loadPrompt = async (name: string, version: number) => {
        // fs中直接保存最新版，方便使用
        const response = await fetch(`/prompts/${name}@${version}.txt`);
        const text = await response.text();
        await fs.writeFile(`prompts/${name}.txt`, text);
    }
    for (const i in PROMPT_FILES) await loadPrompt(i, PROMPT_FILES[i]);
    await db.put('config', latest, 'prompt.version.lock');
}
queueMicrotask(async () => {
    while (1) {
        try { await init_prompts(); break }
        catch (e) {
            try { await ElMessageBox.confirm(h('div', {}, [
                h('div', { style: { color: 'red' } }, '预置Prompt加载失败！是否重试？'),
                h('div', { style: { marginTop: '0.5em', color: 'gray', wordBreak: 'break-all' } }, String(e))
            ]), '错误', {
                confirmButtonText: '重试',
                cancelButtonText: '忽略(不推荐)',
                type: 'error'
            }) } catch { return ElMessage.warning('忽略错误可能遇到意想不到的问题！') }
        }
    }
});


app.mount('vue-app')