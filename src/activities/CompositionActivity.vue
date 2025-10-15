<template>
    <ActivityView>
        <ActivityTitle>{{ pageTitle }}</ActivityTitle>
        <ActivityBody>
            
        </ActivityBody>
    </ActivityView>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

const pageTitle = ref('组卷');

const $emit = defineEmits(['update-title']);
onMounted(() => {
    $emit('update-title', pageTitle.value);
});


</script>

<style scoped>

</style>