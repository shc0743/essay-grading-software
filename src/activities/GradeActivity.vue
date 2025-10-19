<template>
    <ActivityView>
        <ActivityTitle>{{ pageTitle }}</ActivityTitle>
        <ActivityBody style="display: flex; flex-direction: column; height: 100%;">
            <!-- 试题选择 -->
            <div class="question-select-container">
                <ElSelect 
                    v-model="selectedQuestion" 
                    placeholder="请选择试题" 
                    class="question-select"
                    :loading="isLoadingQuestions"
                >
                    <ElOption 
                        v-for="question in questions" 
                        :key="question.filename" 
                        :label="question.name || question.title || '未命名试题'" 
                        :value="question.filename"
                    >
                        <div class="option-content">
                            <span class="option-title">{{ question.name || question.title || '未命名试题' }}</span>
                            <span class="option-subtitle">语言: {{ question.lang || '未设置' }}</span>
                        </div>
                    </ElOption>
                </ElSelect>
            </div>

            <!-- 作文内容输入区域 -->
            <div class="essay-input-container">
                <div class="input-header">
                    <span>作文内容</span>
                    <ElButton type="primary" size="small" @click="showContentInput = true">录入</ElButton>
                </div>
                <ElInput 
                    type="textarea" 
                    v-model="essayContent" 
                    placeholder="请输入或通过录入按钮导入作文内容" 
                    class="essay-textarea"
                />
            </div>

            <!-- 底部功能按钮 -->
            <div class="action-buttons">
                <ElButton type="primary" :disabled="!canGrade" @click="executeGrading">开始批改</ElButton>
            </div>
        </ActivityBody>

        <!-- 内容录入对话框 -->
        <ContentInputView 
            v-model="showContentInput" 
            prompt_file="ocr-essay-english@1.txt"
            @result="handleContentInputResult"
        />

        <!-- 批改结果对话框 -->
        <DialogView v-model="showGradingResult" class="grading-result-dialog">
            <template #title>批改结果</template>
            <div v-if="isGrading" class="grading-progress">正在批改中，请稍候...</div>
            <ElInput 
                v-model="gradingResult" 
                type="textarea" 
                :readonly="true" 
                class="result-textarea"
            />
            <div class="dialog-footer">
                <ElButton type="primary" plain @click="closeGradingResult">确定</ElButton>
            </div>
        </DialogView>
    </ActivityView>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import ContentInputView from '../views/ContentInputView.vue';
import { fs, db } from '@/userdata';
import { fetchEventSource } from '@microsoft/fetch-event-source';

const pageTitle = ref('批改');
const selectedQuestion = ref('');
const essayContent = ref('');
const showContentInput = ref(false);
const showGradingResult = ref(false);
const gradingResult = ref('');
const isGrading = ref(false);
const isLoadingQuestions = ref(false);
const abortController = ref<AbortController | null>(null);

// 试题列表
const questions = ref<Array<{
    filename: string;
    name?: string;
    title?: string;
    lang?: string;
    createTime: string;
}>>([]);

const $emit = defineEmits(['update-title']);

onMounted(async () => {
    $emit('update-title', pageTitle.value);
    await loadQuestions();
});

// 计算属性：是否可以进行批改
const canGrade = computed(() => {
    return selectedQuestion.value && essayContent.value.trim().length > 0;
});

// 加载试题列表
const loadQuestions = async () => {
    try {
        isLoadingQuestions.value = true;
        // 确保目录存在
        await fs.mkdir('user/questions', { recursive: true });
        
        // 读取目录下的所有文件
        const files = await fs.readdir('user/questions');
        
        // 过滤出 .json 文件并按数字降序排序
        const jsonFiles = files
            .filter(file => file.endsWith('.json'))
            .map(file => {
                const match = file.match(/^(\d+)\.json$/);
                return {
                    filename: file,
                    numericId: match ? parseInt(match[1]) : 0
                };
            })
            .filter(item => item.numericId > 0)
            .sort((a, b) => b.numericId - a.numericId); // 降序排序

        // 加载每个文件的元数据
        questions.value = [];
        for (const file of jsonFiles) {
            try {
                const content = await fs.readFile(`user/questions/${file.filename}`, 'utf-8');
                const data = JSON.parse(content);
                questions.value.push({
                    filename: file.filename,
                    name: data.name,
                    title: data.title,
                    lang: data.lang,
                    createTime: data.createTime || new Date(file.numericId).toLocaleString()
                });
            } catch (error) {
                console.error(`读取文件 ${file.filename} 失败:`, error);
                // 如果读取失败，至少显示文件名
                questions.value.push({
                    filename: file.filename,
                    createTime: new Date(file.numericId).toLocaleString()
                });
            }
        }
    } catch (error) {
        console.error('加载试题列表失败:', error);
        ElMessage.error('加载试题列表失败');
    } finally {
        isLoadingQuestions.value = false;
    }
};

// 处理内容录入结果
const handleContentInputResult = (result: string) => {
    essayContent.value = result;
};

// 执行批改操作
const executeGrading = async () => {
    if (!canGrade.value) {
        ElMessage.warning('请选择试题并输入作文内容');
        return;
    }

    try {
        // 获取API配置
        const provider = await db.get("config", "services.api.ocr.provider");
        const providers = await db.get("config", "user.ai_providers");
        if (!provider || !providers) {
            ElMessage.error('请先配置识别接口');
            return;
        }
        const providerConfig = providers.find((p: any) => p.id === provider.id);
        if (!providerConfig || !providerConfig.endpoint) {
            ElMessage.error('配置的识别接口不存在');
            return;
        }
        if (!providerConfig.apiKey) {
            ElMessage.error('没有填写 API Key');
            return;
        }

        // 读取批改提示词文件
        const promptFile = 'essay-grade-english.txt';
        if (!await fs.exists(`prompts/${promptFile}`)) {
            ElMessage.error('批改提示词文件不存在');
            return;
        }
        const prompt = await fs.readFile(`prompts/${promptFile}`, 'utf-8');

        // 读取选中的试题内容
        const questionContent = await fs.readFile(`user/questions/${selectedQuestion.value}`, 'utf-8');
        const questionData = JSON.parse(questionContent);

        // 准备请求数据
        const requestContent = `${prompt}\n\n试题信息:\n${JSON.stringify(questionData, null, 2)}\n\n学生作文:\n${essayContent.value}`;

        // 显示批改结果对话框
        showGradingResult.value = true;
        gradingResult.value = '';
        isGrading.value = true;

        abortController.value = new AbortController();

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
                    content: requestContent
                }],
                stream: true,
            }),
            onmessage: event => {
                if (event.data === '[DONE]' || !event.data) {
                    return;
                }
                const data = JSON.parse(event.data);
                if (data.choices[0].delta.content) {
                    gradingResult.value += data.choices[0].delta.content;
                }
            },
            onerror: e => { throw e },
            signal: abortController.value.signal,
        });
        
        ElMessage.success('批改成功');
    } catch (error) {
        console.error('批改失败:', error);
        gradingResult.value = `批改失败!!\n\n${error}`;
    } finally {
        isGrading.value = false;
    }
};

// 关闭批改结果对话框
const closeGradingResult = () => {
    if (abortController.value) {
        abortController.value.abort();
        abortController.value = null;
    }
    showGradingResult.value = false;
};
</script>

<style scoped>
.question-select-container {
    margin-bottom: 16px;
    padding: 0 16px;
}

.question-select {
    width: 100%;
}

.option-content {
    display: flex;
    flex-direction: column;
}

.option-title {
    font-weight: 500;
}

.option-subtitle {
    font-size: 12px;
    color: #909399;
}

.essay-input-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    margin: 0 16px;
}

.input-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-weight: 500;
}

.essay-textarea {
    flex: 1;
}

.action-buttons {
    margin: 16px;
    display: flex;
    justify-content: center;
}

.grading-result-dialog {
    width: 80%;
    height: 80%;
}

.grading-progress {
    text-align: center;
    padding: 20px;
    color: #606266;
}

.result-textarea {
    height: 80%;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
}

:deep(.essay-textarea) textarea {
    resize: none;
    height: 100%;
}

:deep(.result-textarea) textarea {
    resize: none;
    height: 100%;
}
</style>