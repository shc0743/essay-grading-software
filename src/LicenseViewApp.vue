<template>
    <div v-if="deny">
        <div>很抱歉看到您不同意用户协议。<br>现在可以关闭页面。</div><br>
        <el-button text @click="deny = false">重新考虑</el-button>
    </div>
    <div v-else>
        <h1>用户协议</h1>

        <p v-if="firstRun">欢迎使用{{ app_name }}！在使用本软件之前，请您仔细阅读并同意以下用户协议：</p>
        <p v-else>用户协议和隐私政策有更新，请您审阅这些更新。<br>您将需要同意新的用户协议和隐私政策才能继续使用应用程序。</p>

        <el-checkbox v-model="expand[0]" style="display:block">展开</el-checkbox>
        <div class="license-container" :data-expand="expand[0]" v-html="license_text"></div>

        <hr>

        <h1>隐私政策</h1>
        <p>请继续阅读我们的隐私政策。</p>
        <el-checkbox v-model="expand[1]" style="display:block">展开</el-checkbox>
        <div class="license-container" :data-expand="expand[1]" v-html="privacy_policy_text"></div>

        <hr>

        <!-- <p>感谢您选择{{ app_name }}，我们致力于保护您的隐私和数据安全。如有任何疑问，请随时联系我们。</p> -->

        <!-- <hr> -->

        <div style="font-size: larger;">您是否同意上述《用户协议》和《隐私政策》？</div>

        <div>
            <el-checkbox v-model="agree">同意</el-checkbox>
        </div>

        <el-button v-if="agree" type="primary" plain @click="startuse" size="large">开始使用应用程序</el-button>
        <el-button type="danger" plain size="large" @click="quit">停止使用应用程序</el-button>

        <div style="height: 300px"></div>
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { AGREEMENT_VERSION, app_name } from './config';
import { db } from './userdata';
import { ElMessage } from 'element-plus';

const firstRun = ref(false);
const license_text = ref('正在加载，请稍候...');
const privacy_policy_text = ref('正在加载隐私政策...');
const expand = ref([false, false]);
const agree = ref(false);
const deny = ref(false);

const load_file = async filename => {
    try {
        const response = await fetch(filename, {
            method: 'GET',
            cache: 'no-store'
        });
        if (response.ok) {
            return await response.text();
        } else {
            return '无法加载用户协议。';
        }
    } catch (error) {
        return '加载用户协议时发生错误。';
    }
}

onMounted(async () => {
    firstRun.value = !(await db.get('config', 'agreement.version'));
    license_text.value = await load_file('/assets/license.txt');
    privacy_policy_text.value = await load_file('/assets/privacy-policy.txt');
});

const startuse = async () => {
    await db.put('config', AGREEMENT_VERSION, 'agreement.version');
    ElMessage.success('感谢使用应用程序!');
    history.replaceState(null, '', './');
    location.reload();
}
const quit = function () {
    deny.value = true
    ElMessage.error('用户拒绝用户协议。');
}
</script>

<style>
.license-container {
    /* white-space: pre-wrap; */
    background-color: #f9f9f9;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 5px;
    max-height: 100px;
    overflow: auto;
    word-break: break-word;
    margin-bottom: 1em;
}

.license-container {
    overflow: hidden;
}

.license-container[data-expand="true"] {
    max-height: unset;
    overflow: auto;
}
</style>