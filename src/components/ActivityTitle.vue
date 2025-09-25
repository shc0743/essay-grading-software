<template>
    <div v-bind="$attrs" class="activity-title">
        <ElButton aria-label="返回上一个页面。" title="返回" @click="back" v-if="closable" style="margin-right: 0.5em;">
            <ElIcon>
                <ArrowLeft />
            </ElIcon>
        </ElButton>
        <div
            style="flex: 1; display: flex; align-items: center; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
            <slot></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { ArrowLeft } from '@element-plus/icons-vue';

const props = defineProps({
    closable: {
        type: Boolean,
        default: true,
    },
    isAppTitle: {
        type: Boolean,
        default: false,
    },
});

const $emit = defineEmits(['update-title']);

function back() {
    // @ts-ignore
    if (history.length > 1 && window.navigation && window.navigation.canGoBack) history.back();
    else {
        history.replaceState({}, document.title, '#/');
        window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
}

onMounted(() => {
    nextTick(() => {
        if (props.isAppTitle) $emit('update-title', (document.querySelector('.activity-title') as HTMLElement)?.innerText || '');
    });
});
</script>

<style scoped>
.activity-title {
    padding: 0.5em;
    font-size: x-large;
    display: flex;
    flex-direction: row;
    box-shadow: 0 0 5px 0 gray;
}
</style>
