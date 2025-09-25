<template>
    <div class="activity-view" v-bind="$attrs">
        <slot></slot>
    </div>
</template>

<script setup>

</script>

<style scoped>
.activity-view {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    justify-content: flex-start;
    overflow: hidden;
}
</style>
