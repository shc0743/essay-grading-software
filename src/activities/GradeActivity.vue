<template>
    <ActivityView>
        <ActivityTitle>{{ pageTitle }}</ActivityTitle>
        <ActivityBody>
            <router-link to="/grade/legacy/">返回旧版</router-link>
        </ActivityBody>
    </ActivityView>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

const pageTitle = ref('批改');

const $emit = defineEmits(['update-title']);
onMounted(() => {
    $emit('update-title', pageTitle.value);
});


</script>

<style scoped>

</style>