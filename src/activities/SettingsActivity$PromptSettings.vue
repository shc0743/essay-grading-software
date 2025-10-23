<template>
    <ActivityView>
        <ActivityTitle>{{ pageTitle }}</ActivityTitle>
        <ActivityBody>
            <div class="prompt-management">
                <!-- 操作工具栏 -->
                <div class="toolbar">
                    <el-button type="primary" plain @click="handleCreate" :icon="Plus">
                        新建Prompt
                    </el-button>
                    <el-button @click="refreshPromptList" :icon="Refresh">
                        刷新
                    </el-button>
                </div>

                <!-- Prompt列表 -->
                <div class="prompt-list">
                    <el-table :data="promptList" stripe style="width: 100%">
                        <el-table-column prop="name" label="文件名" min-width="200">
                            <template #default="{ row }">
                                <span class="file-name">{{ row.name }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column prop="size" label="大小" width="100">
                            <template #default="{ row }">
                                {{ formatFileSize(row.size) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="modified" label="修改时间" width="180">
                            <template #default="{ row }">
                                {{ formatDate(row.modified) }}
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="200">
                            <template #default="{ row }">
                                <el-button size="small" @click="handleEdit(row)" :icon="Edit">
                                    编辑
                                </el-button>
                                <el-button size="small" type="danger" plain @click="handleDelete(row)" :icon="Delete">
                                    删除
                                </el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>

                <!-- 空状态 -->
                <div v-if="promptList.length === 0" class="empty-state">
                    <el-empty description="暂无Prompt文件">
                        <el-button type="primary" plain @click="handleCreate">创建第一个Prompt</el-button>
                    </el-empty>
                </div>
            </div>

            <!-- 编辑/创建对话框 -->
            <DialogView v-model="dialogVisible" class="prompt-dialog-container">
                <template #title>{{ dialogTitle }}</template>
                <div class="dialog-view">
                    <div class="dialog-form">
                        <div class="form-item">
                            <label class="form-label">文件名</label>
                            <el-input 
                                v-model="currentPrompt.name" 
                                placeholder="请输入文件名（不含扩展名）"
                                :disabled="isEditing"
                                class="form-input"
                            />
                        </div>
                        <div class="form-item" style="flex: 1;">
                            <label class="form-label">内容</label>
                            <el-input
                                v-model="currentPrompt.content"
                                type="textarea"
                                :rows="8"
                                placeholder="请输入Prompt内容"
                                resize="none"
                                class="form-textarea"
                            />
                        </div>
                    </div>
                    <div class="dialog-actions">
                        <el-button @click="handleDialogClose" class="action-button">取消</el-button>
                        <el-button type="primary" plain @click="handleSave" class="action-button">
                            {{ isEditing ? '保存' : '创建' }}
                        </el-button>
                    </div>
                </div>
            </DialogView>
        </ActivityBody>
    </ActivityView>
</template>

<script setup>
import { fs } from '@/userdata';
import { onMounted, ref, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Refresh, Edit, Delete } from '@element-plus/icons-vue';

const pageTitle = ref('Prompt 管理');

const $emit = defineEmits(['update-title']);

// 响应式数据
const promptList = ref([]);
const dialogVisible = ref(false);
const isEditing = ref(false);
const currentPrompt = reactive({
    name: '',
    content: ''
});

// 计算属性
const dialogTitle = ref('');

// 生命周期
onMounted(async () => {
    $emit('update-title', pageTitle.value);
    await refreshPromptList();
});

// 方法
const refreshPromptList = async () => {
    try {
        // 确保prompts目录存在
        try {
            await fs.access('prompts');
        } catch {
            await fs.mkdir('prompts', { recursive: true });
        }

        const files = await fs.readdir('prompts');
        const prompts = [];

        for (const file of files) {
            if (file.endsWith('.txt')) {
                const filePath = `prompts/${file}`;
                const stats = await fs.stat(filePath);
                const content = await fs.readFile(filePath, 'utf-8');
                
                prompts.push({
                    id: file,
                    name: file.replace('.txt', ''),
                    fullName: file,
                    size: stats.size,
                    modified: stats.mtime,
                    content: content
                });
            }
        }

        promptList.value = prompts;
    } catch (error) {
        console.error('获取Prompt列表失败:', error);
        ElMessage.error('获取Prompt列表失败');
    }
};

const handleCreate = () => {
    isEditing.value = false;
    dialogTitle.value = '新建Prompt';
    currentPrompt.name = '';
    currentPrompt.content = '';
    dialogVisible.value = true;
};

const handleEdit = (prompt) => {
    isEditing.value = true;
    dialogTitle.value = '编辑Prompt';
    currentPrompt.name = prompt.name;
    currentPrompt.content = prompt.content;
    dialogVisible.value = true;
};

const handleDelete = async (prompt) => {
    try {
        await ElMessageBox.confirm(
            `确定要删除Prompt "${prompt.name}" 吗？此操作不可恢复。`,
            '确认删除',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        );

        await fs.unlink(`prompts/${prompt.fullName}`);
        ElMessage.success('删除成功');
        await refreshPromptList();
    } catch (error) {
        if (error !== 'cancel') {
            console.error('删除Prompt失败:', error);
            ElMessage.error('删除失败');
        }
    }
};

const handleSave = async () => {
    if (!currentPrompt.name.trim()) {
        ElMessage.warning('请输入文件名');
        return;
    }

    if (!currentPrompt.content.trim()) {
        ElMessage.warning('请输入Prompt内容');
        return;
    }

    try {
        const fileName = `${currentPrompt.name}.txt`;
        const filePath = `prompts/${fileName}`;

        await fs.writeFile(filePath, currentPrompt.content, 'utf-8');
        
        ElMessage.success(isEditing.value ? '保存成功' : '创建成功');
        dialogVisible.value = false;
        await refreshPromptList();
    } catch (error) {
        console.error('保存Prompt失败:', error);
        ElMessage.error('保存失败');
    }
};

const handleDialogClose = () => {
    dialogVisible.value = false;
};

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('zh-CN');
};
</script>

<style scoped>
.prompt-management {
    padding: 20px;
}

.toolbar {
    margin-bottom: 20px;
}

.prompt-list {
    margin-bottom: 20px;
}

.file-name {
    font-family: 'Courier New', monospace;
    font-weight: bold;
}

.empty-state {
    text-align: center;
    padding: 40px 0;
}

/* DialogView 响应式样式 */
.prompt-dialog-container {
    width: 100%;
    height: 100%;
    padding: 0;
}
.prompt-dialog-container > :nth-child(1) {
    padding: 20px;
    padding-bottom: 0;
}

.dialog-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 0;
    overflow: hidden;
}

.dialog-form {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 20px;
    overflow-y: auto;
}

.form-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-label {
    font-size: 14px;
    font-weight: 500;
    color: #606266;
    line-height: 1.5;
}

.form-input {
    width: 100%;
}

.form-textarea {
    width: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
}

:deep(.form-textarea) > textarea {
    resize: none;
    flex: 1;
}

.dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid #e4e7ed;
    background-color: #fafafa;
    flex-shrink: 0;
}

.action-button {
    min-width: 80px;
}

/* 移动设备响应式适配 */
@media (max-width: 768px) {
    .prompt-management {
        padding: 12px;
    }
    
    .dialog-form {
        padding: 16px;
        gap: 16px;
    }
    
    .form-label {
        font-size: 16px; /* 移动设备上增大字体 */
    }
    
    .dialog-actions {
        padding: 12px 16px;
        gap: 8px;
    }
    .action-button {
        flex: 1;
    }
}

/* 超小屏幕适配 */
@media (max-width: 480px) {
    .dialog-form {
        padding: 12px;
        gap: 12px;
    }
    
    .form-label {
        font-size: 15px;
    }
    
    .dialog-actions {
        padding: 8px 12px;
    }
}

:deep(.el-textarea__inner) {
    font-family: 'Courier New', monospace;
    font-size: 14px;
}

/* DialogView 内部元素样式 */
:deep(.prompt-dialog-container .dialog-view) {
    height: 100%;
}


</style>