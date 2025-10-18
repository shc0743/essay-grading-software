<template>
    <ActivityView>
        <ActivityTitle>{{ pageTitle }}</ActivityTitle>
        <ActivityBody style="display: flex; flex-direction: column; height: 100%; padding: 0;">
            <div class="editor-container">
                <!-- 表单字段 -->
                <div class="form-field">
                    <label class="field-label">试题名称：</label>
                    <div class="field-control">
                        <el-input 
                            v-model="form.name" 
                            placeholder="请输入试题名称" 
                            size="large"
                        />
                    </div>
                </div>

                <div class="form-field">
                    <label class="field-label">作文语言：</label>
                    <div class="field-control">
                        <el-input 
                            v-model="form.lang" 
                            placeholder="请输入作文语言，如：中文、英语等" 
                            size="large"
                        />
                    </div>
                </div>

                <div class="form-field">
                    <label class="field-label">试题内容：</label>
                    <div class="field-control">
                        <div class="content-actions">
                            <el-button @click="pasteContent" :icon="DocumentCopy">
                                粘贴
                            </el-button>
                            <el-button @click="showContentInput" :icon="Picture2">
                                录入
                            </el-button>
                        </div>
                        <el-input
                            v-model="form.content"
                            type="textarea"
                            :rows="15"
                            placeholder="请输入试题内容"
                            resize="none"
                            class="content-textarea"
                        />
                    </div>
                </div>

                <div class="form-field">
                    <label class="field-label">试题总分：</label>
                    <div class="field-control">
                        <el-input
                            v-model="form.max_score"
                            type="number"
                            :min="1"
                            :controls="false"
                            placeholder="请输入总分"
                            style="width: 100%"
                        />
                    </div>
                </div>
            </div>

            <!-- 底部按钮组 -->
            <div class="action-buttons">
                <el-button @click="handleCancel" size="large" :icon="Close">
                    取消
                </el-button>
                <el-button 
                    @click="handleSave" 
                    type="primary" plain
                    size="large"
                    :loading="saving"
                    :icon="Check"
                >
                    保存
                </el-button>
            </div>

            <!-- 内容录入组件 -->
            <ContentInputView 
                v-if="showContentInputDialog"
                v-model="showContentInputDialog"
                prompt_file="ocr-paper-question.txt"
                @result="handleContentInputResult"
            />
        </ActivityBody>
    </ActivityView>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { DocumentCopy, Picture as Picture2, Close, Check } from '@element-plus/icons-vue';
import { fs } from '@/userdata';
import ContentInputView from '@/views/ContentInputView.vue';

const router = useRouter();
const route = useRoute();
const pageTitle = ref('试题编辑器');
const saving = ref(false);
const showContentInputDialog = ref(false);

// 表单数据
const form = ref({
    name: '',
    lang: '',
    content: '',
    max_score: 100
});

// 计算文件名
const filename = computed(() => {
    if (route.params.filename) {
        return route.params.filename as string;
    }
    // 新建时使用时间戳作为文件名
    return `${Date.now()}.json`;
});

const $emit = defineEmits(['update-title']);
onMounted(async () => {
    $emit('update-title', pageTitle.value);
    
    // 如果是编辑模式，加载现有数据
    if (route.params.filename) {
        await loadQuestionData();
    }
    else {
        form.value = {
            name: (new Date().toLocaleString()) + ' - 新试题',
            lang: '',
            content: '',
            max_score: 60,
        };
    }
});

// 加载试题数据
const loadQuestionData = async () => {
    try {
        const filename = route.params.filename as string;
        const content = await fs.readFile(`user/questions/${filename}`, 'utf-8');
        const data = JSON.parse(content);
        
        form.value = {
            name: data.name || '',
            lang: data.lang || '',
            content: data.content || '',
            max_score: data.max_score || 100
        };
    } catch (error) {
        ElMessage.error(`加载试题数据失败: ${error}`);
    }
};

// 粘贴内容
const pasteContent = async () => {
    try {
        const text = await navigator.clipboard.readText();
        form.value.content = text;
        ElMessage.success('粘贴成功');
    } catch (error) {
        ElMessage.error('粘贴失败，请确保已授予剪贴板权限: ' + error);
    }
};

// 显示内容录入对话框
const showContentInput = () => {
    showContentInputDialog.value = true;
};

// 处理内容录入结果
const handleContentInputResult = (content: string) => {
    form.value.content = content;
    showContentInputDialog.value = false;
};

// 验证表单
const validateForm = (): boolean => {
    if (!form.value.name.trim()) {
        ElMessage.error('请输入试题名称');
        return false;
    }
    if (!form.value.lang.trim()) {
        ElMessage.error('请输入作文语言');
        return false;
    }
    if (!form.value.content.trim()) {
        ElMessage.error('请输入试题内容');
        return false;
    }
    if (!form.value.max_score || form.value.max_score < 1) {
        ElMessage.error('请输入有效的试题总分');
        return false;
    }
    return true;
};

// 保存试题
const handleSave = async () => {
    if (!validateForm()) return;

    saving.value = true;
    try {
        const questionData = {
            id: crypto.randomUUID(),
            v: 1,
            name: form.value.name.trim(),
            lang: form.value.lang.trim(),
            content: form.value.content.trim(),
            max_score: form.value.max_score,
            title: form.value.name.trim(), // 使用名称作为标题
            createTime: new Date().toISOString(),
            updateTime: new Date().toISOString()
        };

        // 确保目录存在
        await fs.mkdir('user/questions', { recursive: true });
        
        // 保存文件
        await fs.writeFile(
            `user/questions/${filename.value}`,
            JSON.stringify(questionData, null, 2)
        );

        ElMessage.success('保存成功');
        router.back();
    } catch (error) {
        ElMessage.error('保存失败: ' + error);
    } finally {
        saving.value = false;
    }
};

// 取消编辑
const handleCancel = async () => {
    if (form.value.name || form.value.lang || form.value.content) {
        try {
            await ElMessageBox.confirm(
                '您有未保存的更改，确定要离开吗？',
                '确认离开',
                {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }
            );
            router.back();
        } catch {
            // 用户取消
        }
    } else {
        router.back();
    }
};
</script>

<style scoped>
.editor-container {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
}

.form-field {
    display: flex;
    flex-direction: column;
    margin-bottom: 24px;
}

.field-label {
    font-weight: 600;
    margin-bottom: 8px;
    color: #333;
    font-size: 14px;
}

.field-control {
    width: 100%;
}

.content-actions {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
}

.content-textarea {
    width: 100%;
}

.content-textarea :deep(.el-textarea__inner) {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    line-height: 1.6;
}

.action-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 20px;
    border-top: 1px solid #e0e0e0;
    background: #fafafa;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .editor-container {
        padding: 16px;
    }
    
    .form-field {
        margin-bottom: 20px;
    }
    
    .content-actions {
        flex-direction: column;
    }

    .content-actions .el-button {
        margin-left: 0 !important;
    }
    
    .action-buttons {
        flex-direction: row;
        gap: 8px;
    }

    .action-buttons > .el-button {
        flex: 1;
    }
}

@media (min-width: 769px) {
    .form-field {
        flex-direction: row;
        align-items: flex-start;
    }
    
    .field-label {
        width: 120px;
        margin-bottom: 0;
        padding-top: 8px;
        flex-shrink: 0;
    }
    
    .field-control {
        flex: 1;
    }
}

/* 滚动条样式 */
.editor-container::-webkit-scrollbar {
    width: 6px;
}

.editor-container::-webkit-scrollbar-track {
    background: #f1f1f1;
}

.editor-container::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.editor-container::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>