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
                <ElButton type="primary" plain @click="showContentInput = true">录入</ElButton>
                <ElButton @click="doCopy">复制</ElButton>
            </div>

            <ElInput type="textarea" class="area" v-model="inputText" style="flex: 1; margin-top: 0.5em;" />

            <ContentInputView v-if="showContentInput" v-model="showContentInput" @result="inputText = $event" />
        </ActivityBody>
    </ActivityView>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import ContentInputView from '../views/ContentInputView.vue'
import { ElMessage } from 'element-plus';
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

const doCopy = () => {
    if (inputText.value) {
        navigator.clipboard.writeText(inputText.value);
        ElMessage.success('复制成功');
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