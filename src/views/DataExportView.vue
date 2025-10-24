<template>
    <ElButton @click="importConf">导入配置</ElButton>
    <ElButton @click="exportConf" title="注意：这只会导出配置中的内容。">导出配置</ElButton>
</template>

<script setup lang="ts">
import { ElMessageBox } from 'element-plus';
import { ElPopMessage as ElMessage } from 'el-message-in-popover';
import { db } from '@/userdata';

// 定义 emits
const emit = defineEmits(['import-success']);

// 暴露给父组件的方法
const expose = {
    importData,
    exportData
};
defineExpose(expose);

/**
 * 导入配置数据
 */
async function importConf() {
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

        await importData(value);
    } catch (e) {
        if (e === 'cancel') return;
        console.error('导入配置失败:', e);
        ElMessage.error('导入失败: ' + String(e));
    }
}

/**
 * 导出配置数据
 */
async function exportConf() {
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
        await exportData();
    } catch (e) {
        if (e === 'cancel') return
        ElMessage.error('导出失败: ' + e);
    }
}

/**
 * 编程方式导入数据
 * @param dataStr 要导入的数据字符串
 */
async function importData(dataStr: string) {
    const data = JSON.parse(dataStr);

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

    ElMessage.success('配置导入成功');
    emit('import-success', data);
    
    return data;
}

/**
 * 编程方式导出数据
 */
async function exportData() {
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

    const data = {
        version: 1,
        providers,
        services,
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
    
    return data;
}
</script>

<style scoped>
.el-card + .el-card {
    margin-top: 16px;
}
</style>