<template>
    <ActivityView>
        <ActivityTitle>{{ pageTitle }}</ActivityTitle>
        <ActivityBody>
            <div class="test-section">
                <h3>文件系统操作测试</h3>
                
                <!-- 文件操作 -->
                <div class="operation-group">
                    <ElInput v-model="fileName" placeholder="文件名" style="width: 200px;" />
                    <ElInput 
                        v-model="fileContent" 
                        type="textarea" 
                        placeholder="文件内容" 
                        :rows="4"
                        style="flex: 1; margin: 10px 0;"
                    />
                    
                    <div class="button-group">
                        <ElButton type="primary" @click="writeFile" :loading="loading">写入文件</ElButton>
                        <ElButton @click="readFile" :loading="loading">读取文件</ElButton>
                        <ElButton @click="deleteFile" :loading="loading" danger>删除文件</ElButton>
                        <ElButton @click="listFiles" :loading="loading">列出文件</ElButton>
                    </div>
                </div>

                <!-- 目录操作 -->
                <div class="operation-group">
                    <ElInput v-model="dirName" placeholder="目录名" style="width: 200px;" />
                    <div class="button-group">
                        <ElButton @click="createDir" :loading="loading">创建目录</ElButton>
                        <ElButton @click="listDir" :loading="loading">列出目录</ElButton>
                        <ElButton @click="deleteDir" :loading="loading" danger>删除目录</ElButton>
                    </div>
                </div>

                <!-- 测试结果 -->
                <div class="result-section">
                    <h4>测试结果：</h4>
                    <ElAlert 
                        v-if="testResult.message" 
                        :title="testResult.message" 
                        :type="testResult.type"
                        :closable="false"
                    />
                    
                    <div v-if="fileList.length > 0" class="file-list">
                        <h4>文件列表：</h4>
                        <div v-for="file in fileList" :key="file" class="file-item">
                            {{ file }}
                            <ElButton size="small" @click="loadFile(file)">加载</ElButton>
                        </div>
                    </div>

                    <div v-if="currentFileContent" class="file-content">
                        <h4>当前文件内容：</h4>
                        <pre>{{ currentFileContent }}</pre>
                    </div>
                </div>

                <!-- 快速测试 -->
                <div class="quick-test">
                    <h4>快速测试：</h4>
                    <ElButton @click="runQuickTest" :loading="loading">运行完整测试</ElButton>
                </div>
            </div>
        </ActivityBody>
    </ActivityView>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { fs } from '../userdata';

const pageTitle = ref('文件测试');

// 表单数据
const fileName = ref('test.txt');
const fileContent = ref('这是测试文件内容');
const dirName = ref('testDir');
const loading = ref(false);
const fileList = ref<string[]>([]);
const currentFileContent = ref('');

// 测试结果
const testResult = ref({
    message: '',
    type: 'info' as 'success' | 'warning' | 'info' | 'error'
});

const $emit = defineEmits(['update-title']);

onMounted(() => {
    $emit('update-title', pageTitle.value);
    // 自动列出根目录文件
    listFiles();
});

// 写入文件
const writeFile = async () => {
    if (!fileName.value) {
        showResult('请输入文件名', 'warning');
        return;
    }

    loading.value = true;
    try {
        await fs.writeFile(`/${fileName.value}`, fileContent.value, 'utf8');
        showResult(`文件 ${fileName.value} 写入成功`, 'success');
        listFiles();
    } catch (error: any) {
        showResult(`写入失败: ${error.message}`, 'error');
    } finally {
        loading.value = false;
    }
};

// 读取文件
const readFile = async () => {
    if (!fileName.value) {
        showResult('请输入文件名', 'warning');
        return;
    }

    loading.value = true;
    try {
        const content = await fs.readFile(`/${fileName.value}`, 'utf8');
        currentFileContent.value = content;
        fileContent.value = content;
        showResult(`文件 ${fileName.value} 读取成功`, 'success');
    } catch (error: any) {
        showResult(`读取失败: ${error.message}`, 'error');
    } finally {
        loading.value = false;
    }
};

// 删除文件
const deleteFile = async () => {
    if (!fileName.value) {
        showResult('请输入文件名', 'warning');
        return;
    }

    loading.value = true;
    try {
        await fs.unlink(`/${fileName.value}`);
        showResult(`文件 ${fileName.value} 删除成功`, 'success');
        currentFileContent.value = '';
        fileContent.value = '';
        listFiles();
    } catch (error: any) {
        showResult(`删除失败: ${error.message}`, 'error');
    } finally {
        loading.value = false;
    }
};

// 列出文件
const listFiles = async () => {
    loading.value = true;
    try {
        const files = await fs.readdir('/');
        fileList.value = files;
        showResult(`找到 ${files.length} 个文件/目录`, 'success');
    } catch (error: any) {
        showResult(`列出文件失败: ${error.message}`, 'error');
    } finally {
        loading.value = false;
    }
};

// 创建目录
const createDir = async () => {
    if (!dirName.value) {
        showResult('请输入目录名', 'warning');
        return;
    }

    loading.value = true;
    try {
        await fs.mkdir(`/${dirName.value}`);
        showResult(`目录 ${dirName.value} 创建成功`, 'success');
        listFiles();
    } catch (error: any) {
        showResult(`创建目录失败: ${error.message}`, 'error');
    } finally {
        loading.value = false;
    }
};

// 列出目录内容
const listDir = async () => {
    if (!dirName.value) {
        showResult('请输入目录名', 'warning');
        return;
    }

    loading.value = true;
    try {
        const files = await fs.readdir(`/${dirName.value}`);
        showResult(`目录 ${dirName.value} 包含: ${files.join(', ')}`, 'success');
    } catch (error: any) {
        showResult(`列出目录失败: ${error.message}`, 'error');
    } finally {
        loading.value = false;
    }
};

// 删除目录
const deleteDir = async () => {
    if (!dirName.value) {
        showResult('请输入目录名', 'warning');
        return;
    }

    loading.value = true;
    try {
        await fs.rmdir(`/${dirName.value}`);
        showResult(`目录 ${dirName.value} 删除成功`, 'success');
        listFiles();
    } catch (error: any) {
        showResult(`删除目录失败: ${error.message}`, 'error');
    } finally {
        loading.value = false;
    }
};

// 加载文件到编辑器
const loadFile = async (filename: string) => {
    fileName.value = filename;
    await readFile();
};

// 运行快速测试
const runQuickTest = async () => {
    loading.value = true;
    try {
        // 测试写入
        await fs.writeFile('/quick_test.txt', '快速测试内容', 'utf8');

        // 测试读取
        const content = await fs.readFile('/quick_test.txt', 'utf8');

        // 测试列表
        const files = await fs.readdir('/');

        showResult(`快速测试完成！写入内容: "${content}"，文件数量: ${files.length}`, 'success');
        listFiles();
    } catch (error: any) {
        showResult(`快速测试失败: ${error.message}`, 'error');
    } finally {
        loading.value = false;
    }
};

// 显示结果
const showResult = (message: string, type: 'success' | 'warning' | 'info' | 'error' = 'info') => {
    testResult.value = { message, type };
    ElMessage[type](message);
};
</script>

<style scoped>
.test-section {
    max-width: 800px;
    margin: 0 auto;
}

.operation-group {
    margin-bottom: 20px;
    padding: 16px;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
}

.button-group {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.result-section {
    margin-top: 20px;
}

.file-list {
    margin: 10px 0;
}

.file-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    border-bottom: 1px solid #f0f0f0;
}

.file-content {
    margin-top: 10px;
    padding: 10px;
    background: #f5f5f5;
    border-radius: 4px;
}

.file-content pre {
    white-space: pre-wrap;
    word-wrap: break-word;
}

.quick-test {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #e4e7ed;
}
</style>