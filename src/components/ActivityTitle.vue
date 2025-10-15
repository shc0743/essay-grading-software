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
import { useRouter } from 'vue-router'

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
const router = useRouter()

function back() {
    // @ts-ignore
    if (window.navigation?.canGoBack === false) 
        router.push('/')
    else router.back()
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
