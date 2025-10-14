<template>
    <ActivityView>
        <ActivityTitle>设置</ActivityTitle>
        <ActivityBody>
            <ElCard>
                <template #header>
                    AI 服务提供商
                </template>


            </ElCard>

            <ElCard>
                <template #header>
                    关于
                </template>

                <ElButton @click="router.push('/about/')">打开“关于”页面</ElButton>
            </ElCard>
        </ActivityBody>
    </ActivityView>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

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