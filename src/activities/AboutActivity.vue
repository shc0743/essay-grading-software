<template>
    <ActivityView>
        <ActivityTitle>关于</ActivityTitle>
        <ActivityBody>
            <h1>关于</h1>
            <p>产品名称: <code v-text="app_name"></code></p>
            <p>当前 Endpoint: <span v-text="current_endpoint"></span></p>
            <p>项目地址: <el-link target="_blank" :href="project_path">{{ project_path }}</el-link></p>
            <p style="display: flex; align-items: center;">
                <span style="margin-right: 0.5em;">Egg:</span>
                <ElInput v-model="egg_input" />
            </p>
        </ActivityBody>
    </ActivityView>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

const $emit = defineEmits(['update-title']);
onMounted(() => {
    $emit('update-title', '关于');
});

const router = useRouter();

const current_endpoint = location.origin + location.pathname;
import { project_path } from '@/config.ts';
import { useRouter } from 'vue-router';

const egg_input = ref('');
watch(egg_input, v => {
    if (v === '希娜狄雅' || v === 'Senadina') router.push('/Senadina/');
})
</script>

<style scoped></style>