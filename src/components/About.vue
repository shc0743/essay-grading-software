<template>
    <ActivityView>
        <ActivityTitle>关于</ActivityTitle>
        <ActivityBody>
            <h1>关于</h1>
            <p>产品名称: <code>essay-grading-software</code></p>
            <p>当前 Endpoint: <span v-text="current_endpoint"></span></p>
            <p>项目地址: <el-link target="_blank" :href="project_path" v-text="project_path"></el-link></p>
        </ActivityBody>
    </ActivityView>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

const $emit = defineEmits(['update-title']);
onMounted(() => {
    $emit('update-title', '关于');
});

const current_endpoint = location.origin + location.pathname;
import { project_path } from '@/config.ts';
</script>

<style scoped></style>