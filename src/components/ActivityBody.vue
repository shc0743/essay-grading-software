<template>
    <div style="flex: 1;" v-bind="$attrs">
        <slot></slot>
    </div>
</template>

<script setup>

</script>

<style scoped>
div {
    padding: 10px;
    overflow: auto;
    padding-top: 0;
    margin-top: 10px;
}
</style>
