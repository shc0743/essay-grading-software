<template>
    <ActivityView>
        <ActivityTitle>设置</ActivityTitle>
        <ActivityBody>

        </ActivityBody>
    </ActivityView>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

const $emit = defineEmits(['update-title']);
onMounted(() => {
    $emit('update-title', '设置');
});
</script>

<style scoped>

</style>