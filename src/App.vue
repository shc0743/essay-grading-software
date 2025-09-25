<template>
    <div class="app">
        <FixedLinks />
        <router-view v-slot="{ Component, route }">
            <component :is="Component" @update-title="updateTitle" v-bind="route.params" />
        </router-view>
    </div>
</template>

<script setup lang="ts">
import FixedLinks from './components/FixedLinks.vue';

function updateTitle(newTitle: string) {
    document.title = `${newTitle} - 作文批改程序`;
}
</script>

<style scoped>
.app {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    background: var(--background);
    color: var(--color);
    overflow: hidden;
    --background: #ffffff;
    --color: #000000;
}

.app,
.app * {
    box-sizing: border-box;
}
</style>
