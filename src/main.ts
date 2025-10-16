import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'
// import ElementPlus from 'element-plus'
// import 'element-plus/dist/index.css'
// import { zhCn } from 'element-plus/es/locales.mjs'
import DialogView from 'vue-dialog-view';

const app = createApp(App)

app.config.globalProperties.app_name = 'essay-grading-software';

app.use(router)
// app.use(ElementPlus, {
    // locale: zhCn,
// })
app.use(DialogView);
// console.log('DialogView', DialogView)
// console.log('App', app)

import ActivityView from './components/ActivityView.vue'
import ActivityBody from './components/ActivityBody.vue'
import ActivityTitle from './components/ActivityTitle.vue'
app.component('ActivityView', ActivityView)
app.component('ActivityBody', ActivityBody)
app.component('ActivityTitle', ActivityTitle)

app.mount('vue-app')
