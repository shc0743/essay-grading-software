<template>
    <DialogView v-model="open" class="civ-container">
        <TakePhotoView ref="takePhotoDlg" @shot="p => onFile([p])" />
        <template #title>内容录入</template>
        <div class="view">
            <div class="row">
                <input type="file" ref="fileAdd" multiple v-show="false" @input="onFile(fileAdd.files)" :accept="accept">
                <ElButton size="small" @click="addFile(0)">添加文件</ElButton>
                <ElButton size="small" @click="takePhotoDlg.request()">拍照</ElButton>
                <ElButton size="small" @click="addFile(1)">从相册选择</ElButton>
            </div>

            <div class="row" style="margin-top: 0.5em;">文件列表:</div>
            <div class="file-list">
                <template v-for="(file, index) in fileList" :key="index">
                    <div class="file-item">
                        <span class="file-name" role="link" tabindex="0" @click.prevent="editImg(index)" @keydown.enter.prevent="editImg(index)">{{ file.name || "图片" }}</span>
                        <a href="javascript:" @click.prevent="removeFile(index)">×</a>
                    </div>
                </template>
            </div>
        </div>
        <div class="row" style="margin-top: 1em; justify-content: flex-end;">
            <ElButton type="primary" plain @click="exec">识别文字</ElButton>
            <ElButton type="danger" plain @click="emit('update:modelValue', false)">取消</ElButton>
        </div>

        <DialogView v-model="isSubmited" class="civ-container" :show-close-button="false" :closable="false">
            <template #title>校对</template>
            <div class="row" style="margin-bottom: 0.5em;" v-if="isInProgress">正在识别中，请稍候...</div>
            <ElInput type="textarea" :readonly="isInProgress" v-model="resultText" class="result-text" />
            <div v-if="uncertainCount > 0" style="color: red; margin-top: 0.5em;">有 {{ uncertainCount }} 个识别结果无法确定</div>
            <div class="row" style="margin-top: 0.5em; justify-content: flex-end;">
                <ElCheckbox v-model="ignoreUncertain" v-if="uncertainCount > 0" style="margin-right: 0.5em;">忽略</ElCheckbox>
                <ElButton type="primary" v-if="!isInProgress" :disabled="(uncertainCount > 0) && !ignoreUncertain" plain @click="submitResult(true)">确定</ElButton>
                <ElButton type="danger" plain @click="submitResult(false)">取消</ElButton>
            </div>
        </DialogView>
    </DialogView>
</template>

<script setup>
import { computed, onMounted, ref, nextTick, watch } from 'vue';
import TakePhotoView from './TakePhotoView.vue';
import { ElPopMessage as ElMessage } from '@/ElPopMessage'
import { db, fs } from '@/userdata';
import { fetchEventSource } from '@microsoft/fetch-event-source';

const props = defineProps({
    modelValue: Boolean,
    prompt_file: String,
});
const emit = defineEmits(['update:modelValue', 'result']);

const open = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value),
});

// watch(() => open.value, (newValue) => {
    // if (!newValue) isSubmited.value = false;
// });

const takePhotoDlg = ref(null);
const fileAdd = ref(null);
const accept = ref('');
const fileList = ref([]);

const addFile = async (type) => {
    if (type === 0) {
        accept.value = '';
        await new Promise(nextTick);
        fileAdd.value.click();
    } else if (type === 1) {
        accept.value = 'image/*';
        await new Promise(nextTick);
        fileAdd.value.click();
    }
}

const onFile = (files) => {
    let failCount = 0;
    for (const file of files) {
        if (file && file.type.startsWith('image/')) {
            fileList.value.push(file);
        } else {
            failCount++;
        }
    }
    if (failCount > 0) {
        ElMessage.warning(`处理了 ${files.length} 个文件，其中 ${failCount} 个文件类型错误`);
    }
    else {
        ElMessage.success(`添加了 ${files.length} 个文件`);
    }
}

const removeFile = (index) => {
    fileList.value.splice(index, 1);
}

const editImg = (index) => {
    const file = fileList.value[index];
    if (file.type.startsWith('image/')) {
        
    }
}

const resultText = ref('');
const isInProgress = ref(false);
const isSubmited = ref(false);
const abortController = ref(null);
const ignoreUncertain = ref(false);

const uncertainCount = computed(() => {
    return resultText.value.split('[?]').length - 1;
});

const exec = async () => {
    if (fileList.value.length === 0) {
        ElMessage.warning('请添加文件');
        return;
    }
    const provider = await db.get("config", "services.api.ocr.provider");
    const providers = await db.get("config", "user.ai_providers");
    if (!provider || !providers) {
        ElMessage.error('请先配置识别接口');
        return;
    }
    const providerConfig = providers.find(p => p.id === provider.id);
    if (!providerConfig || !providerConfig.endpoint) {
        ElMessage.error('配置的识别接口不存在');
        return;
    }
    if (!providerConfig.apiKey) {
        ElMessage.error('没有填写 API Key');
        return;
    }
    if (!await fs.exists(`prompts/${props.prompt_file}`)) {
        ElMessage.error('提示词文件不存在');
        return;
    }
    const prompt = await fs.readFile(`prompts/${props.prompt_file}`, 'utf-8');
    isInProgress.value = true;
    isSubmited.value = true;
    // 调用识别接口进行识别(使用@microsoft/fetch-event-source)
    abortController.value = new AbortController();
    try {
        const image_urls = [];
        for (const file of fileList.value) {
            const b64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
            })
            image_urls.push({
                type: "image_url",
                image_url: {
                    url: b64,
                }
            });
        }
        const baseUrl = providerConfig.endpoint;
        const invokeUrl = new URL('chat/completions', baseUrl);
        await fetchEventSource(invokeUrl.href, {
            openWhenHidden: true,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${providerConfig.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: provider.model,
                messages: [{
                    role: "user",
                    content: [
                        ...image_urls,
                        { type: "text", text: prompt }
                    ]
                }],
                stream: true,
            }),
            onmessage: event => {
                if (event.data === '[DONE]' || !event.data) {
                    return;
                }
                const data = JSON.parse(event.data);
                if (data.choices[0].delta.reasoning_content) {
                    // 忽略 reasoning_content
                }
                if (data.choices[0].delta.content) {
                    resultText.value += data.choices[0].delta.content;
                }
            },
            onerror: e => { throw e },
            signal: abortController.value.signal,
        });
        ElMessage.success('调用成功');
    }
    catch (error) {
        resultText.value = `调用失败!!\n\n${error}`;
    }
    finally {
        isInProgress.value = false;
    }
}

const submitResult = (accept) => {
    isSubmited.value = false;
    if (!accept) {
        if (abortController.value) {
            abortController.value.abort();
            abortController.value = null;
        }
        emit('update:modelValue', false);
        return;
    }
    emit('result', resultText.value);
    emit('update:modelValue', false);
}
</script>

<style scoped>
.civ-container {
    width: 80%;
    height: 80%;
}

.view {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.row {
    display: flex;
    align-items: center;
    gap: 0.5em;
}

.file-list {
    flex: 1;
    margin-top: 0.5em;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    padding: 0.5em;
    background-color: #fafafa;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    flex: 1;
}

.file-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75em 1em;
    background-color: white;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.file-item:hover {
    border-color: #409eff;
    box-shadow: 0 2px 6px rgba(64, 158, 255, 0.1);
    transform: translateY(-1px);
}

.file-name {
    flex: 1;
    font-size: 0.9em;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding-right: 0.5em;
    user-select: none;
    cursor: pointer;
    transition: all 0.2s ease;
}

.file-name:hover {
    color: #409eff;
}

.file-item a {
    color: #f56c6c;
    text-decoration: none;
    font-weight: bold;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s ease;
}

.file-item a:hover {
    background-color: #e8e8e8;
}

/* 空状态样式 */
.file-list:empty::before {
    content: "暂无文件";
    color: #999;
    text-align: center;
    padding: 2em;
}

/* 滚动条样式 */
.file-list::-webkit-scrollbar {
    width: 6px;
}

.file-list::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.file-list::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.file-list::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}

.result-text {
    flex: 1;
    margin-top: 0.5em;
    display: flex;
    flex-direction: column;
}

:deep(.result-text) > textarea {
    flex: 1;
    resize: none;
}
</style>