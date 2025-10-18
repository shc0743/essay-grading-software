<template>
    <ActivityView>
        <ActivityTitle>{{ pageTitle }}</ActivityTitle>
        <ActivityBody style="display: flex; flex-direction: column;">
            <div class="row">
                <span>提示词：</span>
                <ElSelect v-model="selectedPrompt" placeholder="请选择提示词">
                    <ElOption v-for="prompt in promptList" :key="prompt.id" :label="prompt.name" :value="prompt.id" />
                </ElSelect>
            </div>

            <div class="row">
                <span>文本：</span>
                <ElButton type="primary" plain @click="doInput">录入</ElButton>
                <ElButton @click="doCopy">复制</ElButton>
                <ElButton @click="saveToDisk">保存</ElButton>
            </div>

            <ElInput type="textarea" class="area" placeholder="文本将显示在这里" v-model="inputText" style="flex: 1; margin-top: 0.5em;" />

            <ContentInputView v-if="showContentInput" v-model="showContentInput" :prompt_file="selectedPrompt" @result="inputText = $event" />
        </ActivityBody>
    </ActivityView>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import ContentInputView from '../views/ContentInputView.vue'
import { ElMessage, ElMessageBox } from 'element-plus';
import { fs } from '../userdata';

const pageTitle = ref('作文识别');
const selectedPrompt = ref('');
const inputText = ref('');
const showContentInput = ref(false);
const promptList = ref([]);

const $emit = defineEmits(['update-title']);
onMounted(async () => {
    $emit('update-title', pageTitle.value);

    // 获取提示词列表
    const prompts = await fs.readdir('prompts');
    promptList.value = prompts.map(prompt => ({
        id: prompt,
        name: prompt,
    }));
});

const doInput = () => {
    if (!selectedPrompt.value) {
        ElMessage.error('请选择提示词');
        return;
    }
    showContentInput.value = true;
}

const doCopy = () => {
    if (inputText.value) {
        navigator.clipboard.writeText(inputText.value);
        ElMessage.success('复制成功');
    }
}

const saveToDisk = async () => {
    try {
        const { value } = await ElMessageBox.prompt('请输入文件名', '保存作文', {
            inputValue: (new Date().getTime()) + '.txt',
            inputPlaceholder: '请输入文件名',
            confirmButtonText: '保存',
            cancelButtonText: '取消',
        });
        if (!value) {
            ElMessage.error('请输入文件名');
            return;
        }
        // ensure dir
        await fs.mkdir('user/essays', { recursive: true });
        await fs.writeFile(`user/essays/${value}`, inputText.value);
        ElMessage.success('保存成功');
    }
    catch (error) {
        ElMessage.error('保存失败: ' + error);
    }
}
</script>

<style scoped>
.row {
    display: flex;
    align-items: center;
}
.row > span {
    white-space: nowrap;
    margin-right: 0.5em;
}
.row + .row {
    margin-top: 10px;
}
.area {
    display: flex;
    flex-direction: column;
}
:deep(.area) > textarea {
    flex: 1;
    resize: none;
}
</style>