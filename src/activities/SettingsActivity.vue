<template>
    <ActivityView>
        <ActivityTitle>设置</ActivityTitle>
        <ActivityBody>
            <ElCard>
                <template #header>
                    AI 服务提供商
                </template>

                <ElButton @click="router.push('/settings/providers')">配置 AI 服务提供商</ElButton>
            </ElCard>

            <ElCard>
                <template #header>
                    Prompt 管理
                </template>

                <ElButton @click="router.push('/settings/prompts')">配置 Prompt</ElButton>
            </ElCard>

            <ElCard>
                <template #header>
                    数据管理
                </template>

                <ElButton @click="importConf">导入配置</ElButton>
                <ElButton @click="exportConf">导出配置</ElButton>
            </ElCard>

            <ElCard>
                <template #header>
                    关于
                </template>

                <ElButton @click="router.push('/about/')">打开“关于”页面</ElButton>
            </ElCard>

            <ElCard>
                <template #header>
                    测试
                </template>

                <ElButton @click="router.push('/fs-test/')">文件系统测试</ElButton>
            </ElCard>
        </ActivityBody>
    </ActivityView>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessageBox, ElMessage } from 'element-plus';
import { db, fs } from '@/userdata';

const router = useRouter();

const $emit = defineEmits(['update-title']);
onMounted(() => {
    $emit('update-title', '设置');
});

const importConf = async () => {
    try {
        // 显示确认导入对话框
        const { value } = await ElMessageBox.prompt(
            '请输入要导入的配置数据:',
            '导入配置',
            {
                confirmButtonText: '导入',
                cancelButtonText: '取消'
            }
        );

        if (!value.trim()) return;

        const data = JSON.parse(value);

        // 验证数据格式
        if (!data.version || !data.providers || !data.services || !data.prompts) {
            throw new Error('无效的配置数据格式');
        }

        // 确认覆盖现有配置
        await ElMessageBox.confirm(
            '这将覆盖现有配置，包括敏感数据。确定要继续吗？',
            '警告',
            {
                confirmButtonText: '继续',
                cancelButtonText: '取消',
                type: 'warning',
            }
        );

        // 导入AI服务提供商
        if (Array.isArray(data.providers)) {
            await db.put('config', data.providers, 'user.ai_providers');
        }

        // 导入服务配置
        for (const [serviceKey, config] of Object.entries(data.services)) {
            if (config) {
                await db.put('config', config, `services.api.${serviceKey}.provider`);
            }
        }

        // 导入Prompt文件
        try {
            // 确保prompts目录存在
            await fs.mkdir('prompts', { recursive: true });

            // 删除现有Prompt文件
            const existingFiles = await fs.readdir('prompts');
            for (const file of existingFiles) {
                if (file.endsWith('.txt')) {
                    await fs.unlink(`prompts/${file}`);
                }
            }

            // 写入新的Prompt文件
            for (const prompt of data.prompts) {
                if (prompt.name && prompt.content) {
                    await fs.writeFile(`prompts/${prompt.name}`, prompt.content, 'utf-8');
                }
            }
        } catch (error) {
            console.error('导入Prompt文件失败:', error);
            throw new Error('导入Prompt文件失败');
        }

        ElMessage.success('配置导入成功');
        // 刷新页面使新配置生效
        setTimeout(() => location.reload(), 1000);
    } catch (e) {
        if (e === 'cancel') return;
        console.error('导入配置失败:', e);
        ElMessage.error('导入失败: ' + String(e));
    }
};
const exportConf = async () => {
    // 显示确认导出对话框，告诉用户包含敏感数据，不要随意分享
    try {
        await ElMessageBox.confirm(
            '这将导出所有配置，包括敏感数据。请确保不要随意分享。',
            '警告',
            {
                confirmButtonText: '导出',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )
    } catch { return }

    try {
        // 获取自定义AI服务提供商列表
        const providers = await db.get('config', 'user.ai_providers') || [];

        // 获取服务配置
        const services: Record<string, any> = {};
        for (const serviceKey of ['ocr', 'grading']) {
            const config = await db.get('config', `services.api.${serviceKey}.provider`);
            if (config) {
                services[serviceKey] = config;
            }
        }

        // 获取Prompt文件列表及内容
        const prompts = [];
        try {
            const files = await fs.readdir('prompts');
            for (const file of files) {
                if (file.endsWith('.txt')) {
                    const content = await fs.readFile(`prompts/${file}`, 'utf-8');
                    prompts.push({
                        name: file,
                        content: content
                    });
                }
            }
        } catch (error) {
            console.error('读取Prompt文件失败:', error);
        }

        const data = {
            version: 1,
            providers: providers,
            services: services,
            prompts: prompts,
            exportedAt: new Date().toISOString()
        };

        // 显示给用户
        const { value } = await ElMessageBox.prompt('以下是导出的数据:', '导出数据', {
            inputValue: JSON.stringify(data),
            confirmButtonText: '复制',
            cancelButtonText: '取消'
        });
        await navigator.clipboard.writeText(value);
        ElMessage.success('已复制到剪贴板');
    } catch (e) {
        if (e === 'cancel') return
        ElMessage.error('导出失败: ' + e);
    }
};
</script>

<style scoped>
.el-card+.el-card {
    margin-top: 16px;
}
</style>