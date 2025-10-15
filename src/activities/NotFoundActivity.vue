<template>
    <div class="not-found">
        <h1>404 - 页面未找到</h1>
        <p>您访问的页面不存在。</p>
        <router-link to="/">返回首页</router-link>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

const emit = defineEmits(['update-title']);
onMounted(() => {
    emit('update-title', '页面未找到');
});
</script>

<style scoped>
.not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
}
</style>