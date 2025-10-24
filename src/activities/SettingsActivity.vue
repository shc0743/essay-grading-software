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

                <DataExportView />
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
import DataExportView from '@/views/DataExportView.vue';

const router = useRouter();

const $emit = defineEmits(['update-title']);
onMounted(() => {
    $emit('update-title', '设置');
});

</script>

<style scoped>
.el-card+.el-card {
    margin-top: 16px;
}
</style>