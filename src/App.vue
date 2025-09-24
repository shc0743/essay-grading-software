<template>
    <div class="app">
        <FixedLinks />
        <router-view></router-view>
    </div>
</template>

<script setup lang="ts">
import FixedLinks from './components/FixedLinks.vue';

</script>

<style scoped>
.app {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    background: var(--background);
    color: var(--color);
    --background: #f9f9f9;
    --color: #000000;
}
.app, .app * {
    box-sizing: border-box;
}
</style>
