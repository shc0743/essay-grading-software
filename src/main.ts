import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { zhCn } from 'element-plus/es/locales.mjs'

const app = createApp(App)

app.use(router)
app.use(ElementPlus, {
    locale: zhCn,
})

app.mount('vue-app')
