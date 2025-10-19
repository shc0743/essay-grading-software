<template>
    <ActivityView>
        <ActivityTitle>{{ pageTitle }}</ActivityTitle>
        <ActivityBody style="display: flex; flex-direction: column; height: 100%;">
            <!-- 试题列表 -->
            <div class="question-list">
                <!-- "新试题" 选项 -->
                <div class="list-item new-question" @click="createNewQuestion">
                    <div class="item-content">
                        <span class="item-title">➕ 新试题</span>
                        <span class="item-subtitle">点击创建新的试题</span>
                    </div>
                    <el-icon><ArrowRight /></el-icon>
                </div>

                <!-- 试题列表 -->
                <div 
                    v-for="question in displayedQuestions" 
                    :key="question.filename"
                    class="list-item"
                    @click="editQuestion(question.filename)"
                >
                    <div class="item-content">
                        <span class="item-title">{{ question.name || question.title || '未命名试题' }}</span>
                        <span class="item-subtitle">语言: {{ question.lang || '未设置' }}</span>
                        <span class="item-meta">创建时间: {{ question.createTime }}</span>
                    </div>
                    <el-icon><ArrowRight /></el-icon>
                </div>

                <!-- 空状态 -->
                <div v-if="questions.length === 0" class="empty-state">
                    <el-empty description="暂无试题，点击上方创建新试题" />
                </div>
            </div>

            <!-- 分页组件 -->
            <div class="pagination-container" v-if="questions.length > 0">
                <el-pagination
                    v-model:current-page="currentPage"
                    v-model:page-size="pageSize"
                    :page-sizes="[5, 10, 20, 50, 100]"
                    :total="totalQuestions"
                    layout="total, sizes, prev, pager, next, jumper"
                    @size-change="handleSizeChange"
                    @current-change="handleCurrentChange"
                    size=small
                />
            </div>
        </ActivityBody>
    </ActivityView>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowRight } from '@element-plus/icons-vue';
import { fs } from '@/userdata';

const pageTitle = ref('组卷');
const router = useRouter();

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
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

// 计算属性
const totalQuestions = computed(() => questions.value.length);
const displayedQuestions = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return questions.value.slice(start, end);
});

// 加载试题列表
const loadQuestions = async () => {
    try {
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
    }
};

// 创建新试题
const createNewQuestion = () => {
    router.push('/compose/edit/');
};

// 编辑现有试题
const editQuestion = (filename: string) => {
    router.push(`/compose/edit/${filename}`);
};

// 分页事件处理
const handleSizeChange = (newSize: number) => {
    pageSize.value = newSize;
    currentPage.value = 1; // 重置到第一页
};

const handleCurrentChange = (newPage: number) => {
    currentPage.value = newPage;
};
</script>

<style scoped>
.question-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
}

.list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    margin: 8px 0;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.list-item:hover {
    border-color: #409eff;
    box-shadow: 0 2px 6px rgba(64, 158, 255, 0.15);
}

.list-item.new-question {
    background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
    border: 2px dashed #409eff;
}

.item-content {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.item-title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
}

.item-subtitle {
    font-size: 14px;
    color: #666;
    margin-bottom: 2px;
}

.item-meta {
    font-size: 12px;
    color: #999;
}

.empty-state {
    padding: 40px 0;
}

.pagination-container {
    margin-top: 20px;
    padding: 16px;
    background: white;
    border-top: 1px solid #e0e0e0;
    display: flex;
    overflow: auto;
}

.pagination-container > * {
    margin: 0 auto;
}

/* 滚动条样式 */
.question-list::-webkit-scrollbar {
    width: 6px;
}

.question-list::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.question-list::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.question-list::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>